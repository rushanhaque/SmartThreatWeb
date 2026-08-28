/* ============================================================================
   PRIVACYGLASS · APPLICATION STORE
   ----------------------------------------------------------------------------
   A ~120-line external store read through `useSyncExternalStore` with memoised
   selectors. Deliberately not Redux/Zustand: the app has one writer (the
   telemetry loop) and many narrow readers, which is exactly the shape this
   primitive is built for — and it keeps a screen from re-rendering because an
   unrelated sensor moved 2 dB.
   ========================================================================== */

import { useCallback, useRef, useSyncExternalStore } from 'react'
import type {
  Device,
  HardwareState,
  Incident,
  Prefs,
  ScanSession,
  Scenario,
  SensorFrame,
  Trust,
  Verdict,
} from './types'
import { fuse } from './fusion'
import { buildDevices, driftDevices, nextFrame, placeFor, seedFrames } from './simulator'

export interface State {
  booted: boolean
  onboarded: boolean
  paired: boolean
  place: string
  hw: HardwareState
  devices: Device[]
  frames: SensorFrame[]
  verdict: Verdict
  incidents: Incident[]
  sessions: ScanSession[]
  prefs: Prefs
  /** Rooms the user has vouched for — suppresses repeat alerts. */
  trustedMacs: string[]
}

const FRAME_CAP = 240 // 2 minutes at 500 ms
const PREFS_KEY = 'pg1.prefs.v1'
const FLAGS_KEY = 'pg1.flags.v1'

const DEFAULT_PREFS: Prefs = {
  sensitivity: 'balanced',
  channels: { oled: true, haptic: true, buzzer: true, push: true },
  darkBoost: true,
  autoDeepScan: false,
  passiveOnly: true,
  scenario: 'camera',
  scanning: true,
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFS
  }
}

function loadFlags(): { onboarded: boolean } {
  try {
    return { onboarded: false, ...JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '{}') }
  } catch {
    return { onboarded: false }
  }
}

function seedHistory(now: number): { incidents: Incident[]; sessions: ScanSession[] } {
  const h = 3_600_000
  return {
    incidents: [
      {
        id: 'inc-1',
        startedAt: now - 26 * h,
        endedAt: now - 26 * h + 9 * 60_000,
        klass: 'threat',
        peakScore: 88,
        place: 'Hotel room 412',
        deviceIds: ['camera-1'],
        acknowledged: true,
        reasons: [],
      },
      {
        id: 'inc-2',
        startedAt: now - 51 * h,
        endedAt: now - 51 * h + 22 * 60_000,
        klass: 'caution',
        peakScore: 46,
        place: 'Cafe · Sector 18',
        deviceIds: [],
        acknowledged: true,
        reasons: [],
      },
      {
        id: 'inc-3',
        startedAt: now - 96 * h,
        endedAt: now - 96 * h + 14 * 60_000,
        klass: 'threat',
        peakScore: 74,
        place: 'Route 3 · in transit',
        deviceIds: ['tracker-0'],
        acknowledged: true,
        reasons: [],
      },
    ],
    sessions: [
      { id: 's1', place: 'Hotel room 412', startedAt: now - 26 * h, durationSec: 214, devicesSeen: 8, peakScore: 88, klass: 'threat', verdictNote: 'Hikvision unit behind the smoke detector. Reported to front desk.' },
      { id: 's2', place: 'Gate 4B · IGI T3', startedAt: now - 30 * h, durationSec: 96, devicesSeen: 21, peakScore: 31, klass: 'safe', verdictNote: 'Dense but ordinary. No camera OUI, no co-moving tag.' },
      { id: 's3', place: 'Cafe · Sector 18', startedAt: now - 51 * h, durationSec: 180, devicesSeen: 12, peakScore: 46, klass: 'caution', verdictNote: 'Unattributed 2.4 GHz carrier. Cleared after the router learned in.' },
      { id: 's4', place: 'Route 3 · in transit', startedAt: now - 96 * h, durationSec: 840, devicesSeen: 6, peakScore: 74, klass: 'threat', verdictNote: 'AirTag rode with you for 17 min across four stops.' },
      { id: 's5', place: 'Home · Chandausi', startedAt: now - 120 * h, durationSec: 300, devicesSeen: 7, peakScore: 8, klass: 'safe', verdictNote: 'Baseline capture. Seven radios added to the trusted list.' },
    ],
  }
}

function initialState(): State {
  const now = Date.now()
  const prefs = loadPrefs()
  const flags = loadFlags()
  const devices = buildDevices(prefs.scenario, now)
  const frames = seedFrames(prefs.scenario, now)
  const { incidents, sessions } = seedHistory(now)
  return {
    booted: false,
    onboarded: flags.onboarded,
    paired: true,
    place: placeFor(prefs.scenario),
    hw: {
      connected: true,
      linkRssi: -54,
      batteryPct: 78,
      charging: false,
      temperatureC: 33.4,
      firmware: '0.9.4-rc2',
      modelVersion: 'rf100-v7 · 92.4%',
      storageUsedPct: 34,
      uptimeSec: 8_140,
      serial: 'PG1-24B-0117',
    },
    devices,
    frames,
    verdict: fuse(devices, frames, now, prefs.sensitivity),
    incidents,
    sessions,
    prefs,
    trustedMacs: devices.filter((d) => d.trust === 'trusted').map((d) => d.mac),
  }
}

/* ── Store core ──────────────────────────────────────────────────────────── */

let state: State = initialState()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export const store = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  set(patch: Partial<State> | ((s: State) => Partial<State>)) {
    const next = typeof patch === 'function' ? patch(state) : patch
    state = { ...state, ...next }
    emit()
  },
}

/* ── Selector hook ───────────────────────────────────────────────────────── */

export function useSelect<T>(selector: (s: State) => T, isEqual: (a: T, b: T) => boolean = Object.is): T {
  const cache = useRef<{ s: State; v: T } | null>(null)

  const getSnapshot = useCallback(() => {
    const s = store.get()
    const last = cache.current
    if (last && last.s === s) return last.v
    const v = selector(s)
    if (last && isEqual(last.v, v)) {
      cache.current = { s, v: last.v }
      return last.v
    }
    cache.current = { s, v }
    return v
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, isEqual])

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot)
}

export function shallowArrayEq<T>(a: readonly T[], b: readonly T[]) {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

/* ── Common selectors (module scope so their identity is stable) ─────────── */

export const selVerdict = (s: State) => s.verdict
export const selDevices = (s: State) => s.devices
export const selFrames = (s: State) => s.frames
export const selPrefs = (s: State) => s.prefs
export const selHw = (s: State) => s.hw
export const selPlace = (s: State) => s.place
export const selIncidents = (s: State) => s.incidents
export const selSessions = (s: State) => s.sessions
export const selOnboarded = (s: State) => s.onboarded
export const selScanning = (s: State) => s.prefs.scanning
export const selScenario = (s: State) => s.prefs.scenario
export const selKlass = (s: State) => s.verdict.klass
export const selScore = (s: State) => s.verdict.score

export const selDeviceById = (id: string) => (s: State) => s.devices.find((d) => d.id === id) ?? null

/* ── Actions ─────────────────────────────────────────────────────────────── */

function persistPrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p))
  } catch {
    /* private mode — preferences stay session-local, which is acceptable */
  }
}

export const actions = {
  setPrefs(patch: Partial<Prefs>) {
    store.set((s) => {
      const prefs = { ...s.prefs, ...patch }
      persistPrefs(prefs)
      const verdict = fuse(s.devices, s.frames, Date.now(), prefs.sensitivity)
      return { prefs, verdict }
    })
  },

  setScenario(scenario: Scenario) {
    const now = Date.now()
    const devices = buildDevices(scenario, now)
    const frames = seedFrames(scenario, now)
    store.set((s) => {
      const prefs = { ...s.prefs, scenario }
      persistPrefs(prefs)
      return {
        prefs,
        devices,
        frames,
        place: placeFor(scenario),
        verdict: fuse(devices, frames, now, prefs.sensitivity),
      }
    })
  },

  setTrust(id: string, trust: Trust) {
    store.set((s) => {
      const devices = s.devices.map((d) => (d.id === id ? { ...d, trust } : d))
      return { devices, verdict: fuse(devices, s.frames, Date.now(), s.prefs.sensitivity) }
    })
  },

  completeOnboarding() {
    try {
      localStorage.setItem(FLAGS_KEY, JSON.stringify({ onboarded: true }))
    } catch {
      /* ignore */
    }
    store.set({ onboarded: true })
  },

  resetOnboarding() {
    try {
      localStorage.removeItem(FLAGS_KEY)
    } catch {
      /* ignore */
    }
    store.set({ onboarded: false })
  },

  acknowledge(id: string) {
    store.set((s) => ({
      incidents: s.incidents.map((i) => (i.id === id ? { ...i, acknowledged: true } : i)),
    }))
  },

  /** Records the result of a completed Deep Scan into history. */
  logSession(session: ScanSession) {
    store.set((s) => ({ sessions: [session, ...s.sessions] }))
  },

  toggleScanning() {
    actions.setPrefs({ scanning: !store.get().prefs.scanning })
  },
}

/* ── Telemetry loop ──────────────────────────────────────────────────────── */

let timer: number | null = null

function tick() {
  const s = store.get()
  if (!s.prefs.scanning) return
  const now = Date.now()

  // Two 500 ms samples per 1 s wake — matches the firmware's sensor cadence
  // while keeping React to one render per second.
  const last = s.frames[s.frames.length - 1]
  const f1 = nextFrame(s.prefs.scenario, last, now - 500)
  const f2 = nextFrame(s.prefs.scenario, f1, now)
  const frames = [...s.frames, f1, f2].slice(-FRAME_CAP)
  const devices = driftDevices(s.devices, now)

  store.set({
    frames,
    devices,
    verdict: fuse(devices, frames, now, s.prefs.sensitivity),
    hw: { ...s.hw, uptimeSec: s.hw.uptimeSec + 1, linkRssi: Math.round(-54 + (Math.random() - 0.5) * 6) },
  })
}

export function startTelemetry() {
  if (timer !== null) return () => {}
  store.set({ booted: true })

  const run = () => {
    // A backgrounded tab has no viewer; burning battery on it is indefensible
    // in an app whose entire premise is a 3-hour field runtime.
    if (document.visibilityState === 'visible') tick()
  }
  timer = window.setInterval(run, 1000)

  const onVis = () => {
    if (document.visibilityState === 'visible') tick()
  }
  document.addEventListener('visibilitychange', onVis)

  return () => {
    if (timer !== null) window.clearInterval(timer)
    timer = null
    document.removeEventListener('visibilitychange', onVis)
  }
}
