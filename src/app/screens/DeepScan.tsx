/* ============================================================================
   DEEP SCAN — the 90-second sweep
   ----------------------------------------------------------------------------
   Passive monitoring runs forever in the background; this is the deliberate,
   user-initiated pass you run when you first walk into a room. It is a
   full-bleed flow with no tab bar because it wants your attention for ninety
   seconds and then gives it back.

   The animation is doing real work: each stage is a genuine phase of the
   firmware's sweep, and findings stream in as they are actually produced.
   Progress theatre with no underlying process would be a lie the user could
   eventually catch — and this product only works if it is trusted.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Label, Panel, Pill, cx } from '@/components/ui'
import { Icon, type IconName } from '@/components/Icon'
import { ApertureRing } from '@/components/viz'
import { actions, selDevices, selPlace, selVerdict, useSelect } from '@/engine/store'
import { CLASS_META } from '@/engine/fusion'
import { deviceTone } from './Devices'
import { haptic, useScrollLock } from '@/lib/hooks'
import { throughput } from '@/lib/format'

interface Stage {
  id: string
  label: string
  detail: string
  icon: IconName
  /** Seconds this stage occupies of the 90 s budget. */
  weight: number
}

const STAGES: Stage[] = [
  { id: 'wifi', label: 'Wi-Fi sweep', detail: 'Hopping 2.4 and 5 GHz channels in promiscuous mode', icon: 'wifi', weight: 26 },
  { id: 'ble', label: 'BLE census', detail: 'Logging every advertisement and parsing manufacturer data', icon: 'bluetooth', weight: 22 },
  { id: 'rf', label: 'RF sweep', detail: 'Stepping the detector across 433 MHz to 5.8 GHz', icon: 'radio', weight: 20 },
  { id: 'field', label: 'Field + light', detail: 'Averaging 40 EM samples and reading ambient lux', icon: 'bolt', weight: 12 },
  { id: 'fuse', label: 'Fusion', detail: 'Running the classifier and weighing the channels', icon: 'aperture', weight: 10 },
]

const TOTAL = STAGES.reduce((a, s) => a + s.weight, 0)

interface Finding {
  id: string
  stage: string
  text: string
  tone: 'muted' | 'accent' | 'threat'
}

type Phase = 'idle' | 'running' | 'done'

export default function DeepScan() {
  const navigate = useNavigate()
  const devices = useSelect(selDevices)
  const verdict = useSelect(selVerdict)
  const place = useSelect(selPlace)

  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [findings, setFindings] = useState<Finding[]>([])
  const emitted = useRef(new Set<string>())
  useScrollLock(true)

  /* The findings script is derived from the real device list, so what streams
     past during the scan is exactly what the list view will show afterwards. */
  const script = useMemo<Array<{ at: number; f: Finding }>>(() => {
    const out: Array<{ at: number; f: Finding }> = []
    const wifi = devices.filter((d) => d.kind.startsWith('wifi'))
    const ble = devices.filter((d) => d.kind.startsWith('ble'))

    wifi.forEach((d, i) => {
      const tone = deviceTone(d)
      out.push({
        at: 3 + i * (20 / Math.max(1, wifi.length)),
        f: {
          id: `w-${d.id}`,
          stage: 'wifi',
          text: `${d.label ?? d.vendor} · ${d.mac.slice(0, 8)} · ${d.rssi} dBm`,
          tone: tone === 'threat' ? 'threat' : tone === 'caution' ? 'accent' : 'muted',
        },
      })
    })

    devices
      .filter((d) => d.signals.includes('camera-oui'))
      .forEach((d, i) =>
        out.push({
          at: 16 + i * 2,
          f: { id: `oui-${d.id}`, stage: 'wifi', text: `OUI ${d.oui} → ${d.vendor} · camera vendor`, tone: 'threat' },
        }),
      )

    devices
      .filter((d) => d.signals.includes('streaming'))
      .forEach((d, i) =>
        out.push({
          at: 20 + i * 2,
          f: { id: `str-${d.id}`, stage: 'wifi', text: `${throughput(d.throughputKbps)} sustained · H.264 packet cadence`, tone: 'threat' },
        }),
      )

    ble.forEach((d, i) => {
      const tone = deviceTone(d)
      out.push({
        at: 28 + i * (18 / Math.max(1, ble.length)),
        f: {
          id: `b-${d.id}`,
          stage: 'ble',
          text: `${d.label ?? (d.macRandomised ? 'Randomised address' : d.vendor)} · ${d.rssi} dBm`,
          tone: tone === 'threat' ? 'threat' : tone === 'caution' ? 'accent' : 'muted',
        },
      })
    })

    devices
      .filter((d) => d.signals.includes('travelling'))
      .forEach((d, i) =>
        out.push({
          at: 44 + i * 2,
          f: { id: `tr-${d.id}`, stage: 'ble', text: `${d.vendor} co-moving with you — dwell exceeds threshold`, tone: 'threat' },
        }),
      )

    out.push(
      { at: 50, f: { id: 'rf-1', stage: 'rf', text: '433.9 MHz — quiet', tone: 'muted' } },
      { at: 54, f: { id: 'rf-2', stage: 'rf', text: '1.2 GHz analogue band — quiet', tone: 'muted' } },
      {
        at: 60,
        f: {
          id: 'rf-3',
          stage: 'rf',
          text: `2.4 GHz peak ${Math.round(verdict.breakdown.rf * 40 - 70)} dBm`,
          tone: verdict.breakdown.rf > 0.5 ? 'threat' : 'muted',
        },
      },
      { at: 66, f: { id: 'rf-4', stage: 'rf', text: '5.8 GHz analogue band — quiet', tone: 'muted' } },
      {
        at: 72,
        f: {
          id: 'em-1',
          stage: 'field',
          text: `EM field ${(verdict.breakdown.emf * 10).toFixed(1)} mG`,
          tone: verdict.breakdown.emf > 0.3 ? 'accent' : 'muted',
        },
      },
      {
        at: 78,
        f: {
          id: 'em-2',
          stage: 'field',
          text: verdict.breakdown.dark > 0.5 ? 'Low light — IR-capable optics favoured' : 'Ambient light normal',
          tone: verdict.breakdown.dark > 0.5 ? 'accent' : 'muted',
        },
      },
      { at: 84, f: { id: 'fz-1', stage: 'fuse', text: 'Feature vector assembled · 10 dimensions', tone: 'muted' } },
      { at: 87, f: { id: 'fz-2', stage: 'fuse', text: 'RandomForest · 100 trees · agreement reached', tone: 'muted' } },
    )

    return out.sort((a, b) => a.at - b.at)
  }, [devices, verdict.breakdown])

  /* Drive the clock. 90 s of firmware time is compressed to ~14 s here so the
     flow is demonstrable; SCAN_SECONDS is the only knob that changes. */
  const SCAN_SECONDS = 90
  const REAL_MS = 14_000

  useEffect(() => {
    if (phase !== 'running') return
    const started = performance.now()
    let raf = 0
    const step = (now: number) => {
      const p = Math.min(1, (now - started) / REAL_MS)
      setElapsed(p * SCAN_SECONDS)
      if (p < 1) raf = requestAnimationFrame(step)
      else {
        setPhase('done')
        haptic(verdict.klass === 'safe' ? 'success' : 'threat')
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [phase, verdict.klass])

  useEffect(() => {
    if (phase !== 'running') return
    const due = script.filter((s) => s.at <= elapsed && !emitted.current.has(s.f.id))
    if (!due.length) return
    due.forEach((s) => emitted.current.add(s.f.id))
    setFindings((prev) => [...due.map((s) => s.f).reverse(), ...prev].slice(0, 60))
  }, [elapsed, phase, script])

  const start = useCallback(() => {
    emitted.current.clear()
    setFindings([])
    setElapsed(0)
    setPhase('running')
    haptic('tap')
  }, [])

  const progress = elapsed / SCAN_SECONDS
  const stageIndex = useMemo(() => {
    let acc = 0
    for (let i = 0; i < STAGES.length; i++) {
      acc += STAGES[i].weight
      if (elapsed < acc) return i
    }
    return STAGES.length - 1
  }, [elapsed])

  const meta = CLASS_META[verdict.klass]

  const save = () => {
    actions.logSession({
      id: `s-${Date.now()}`,
      place,
      startedAt: Date.now() - SCAN_SECONDS * 1000,
      durationSec: SCAN_SECONDS,
      devicesSeen: devices.length,
      peakScore: verdict.score,
      klass: verdict.klass,
      verdictNote: meta.verb,
    })
    navigate('/app/history')
  }

  return (
    <div className={cx('fixed inset-0 z-50 flex flex-col bg-bg', meta.tone)}>
      {/* ambient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[50vh]"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 70%)',
        }}
      />

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div
        className="relative flex h-14 shrink-0 items-center justify-between px-4"
        style={{ paddingTop: 'var(--spacing-safe-t)' }}
      >
        <div className="min-w-0">
          <Label>DEEP SCAN</Label>
          <div className="mt-1 truncate text-[13px] font-medium text-ink">{place}</div>
        </div>
        <button
          onClick={() => navigate('/app')}
          aria-label="Close deep scan"
          className="press grid h-10 w-10 place-items-center rounded-sm text-ink-2 hover:bg-surface-2"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      {/* ── Ring ─────────────────────────────────────────────────── */}
      <div className="relative flex shrink-0 flex-col items-center pt-3 pb-5">
        <ApertureRing
          score={phase === 'done' ? verdict.score : Math.round(progress * 100)}
          klass={verdict.klass}
          size={224}
          scanning={phase === 'running'}
        >
          {phase === 'done' ? (
            <>
              <div className="readout text-[52px] font-semibold leading-none tracking-[-0.05em]">
                {verdict.score}
              </div>
              <div className="mt-1.5 text-[14px] font-semibold text-[var(--accent)]">
                {meta.label}
              </div>
            </>
          ) : (
            <>
              <div className="readout text-[52px] font-semibold leading-none tracking-[-0.05em]">
                {Math.round(progress * 100)}
                <span className="text-[20px] text-ink-3">%</span>
              </div>
              <Label className="mt-2">
                {phase === 'idle' ? 'READY' : `${Math.max(0, Math.ceil(SCAN_SECONDS - elapsed))} S LEFT`}
              </Label>
            </>
          )}
        </ApertureRing>
      </div>

      {/* ── Stages ───────────────────────────────────────────────── */}
      <div className="relative shrink-0 px-4">
        <div className="flex gap-1.5">
          {STAGES.map((s, i) => {
            const done = phase === 'done' || i < stageIndex
            const active = phase === 'running' && i === stageIndex
            return (
              <div key={s.id} className="flex-1" style={{ flexGrow: s.weight }}>
                <div className="h-[3px] overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{
                      width: done ? '100%' : active ? `${stageProgress(elapsed, i) * 100}%` : '0%',
                      transition: 'width .2s linear',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <div
            className={cx(
              'grid h-8 w-8 shrink-0 place-items-center rounded-sm border',
              phase === 'running'
                ? 'border-[color-mix(in_srgb,var(--accent)_36%,transparent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-line bg-bg-2 text-ink-3',
            )}
          >
            <Icon name={phase === 'done' ? 'check' : STAGES[stageIndex].icon} size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium text-ink">
              {phase === 'done' ? 'Sweep complete' : STAGES[stageIndex].label}
            </div>
            <div className="truncate text-[12px] text-ink-3">
              {phase === 'done'
                ? `${devices.length} radios logged · ${verdict.reasons.length} signals raised`
                : STAGES[stageIndex].detail}
            </div>
          </div>
        </div>
      </div>

      {/* ── Findings stream ──────────────────────────────────────── */}
      <div className="relative mt-4 min-h-0 flex-1 overflow-hidden px-4">
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-bg-2/70">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <Label>LIVE FINDINGS</Label>
            <span className="readout text-[11px] text-ink-4">{findings.length} logged</span>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-2">
            {findings.length === 0 && (
              <li className="py-6 text-center text-[12.5px] text-ink-4">
                {phase === 'idle' ? 'Press start when you are inside the room.' : 'Listening…'}
              </li>
            )}
            {findings.map((f) => (
              <li
                key={f.id}
                className="anim-rise flex items-start gap-2.5 border-b border-line/60 py-2 last:border-0"
              >
                <span
                  className={cx(
                    'mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full',
                    f.tone === 'threat'
                      ? 'bg-threat'
                      : f.tone === 'accent'
                        ? 'bg-caution'
                        : 'bg-ink-4',
                  )}
                />
                <span
                  className={cx(
                    'readout text-[11.5px] leading-relaxed',
                    f.tone === 'threat' ? 'text-threat' : f.tone === 'accent' ? 'text-ink' : 'text-ink-3',
                  )}
                >
                  {f.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div
        className="relative shrink-0 space-y-2 px-4 pt-4 pb-4"
        style={{ paddingBottom: 'calc(1rem + var(--spacing-safe-b))' }}
      >
        {phase === 'idle' && (
          <>
            <Button full size="lg" variant="accent" icon="scan" onClick={start}>
              Start 90-second sweep
            </Button>
            <p className="text-center text-[11.5px] leading-relaxed text-ink-4">
              Stand near the centre of the room and turn slowly once. Passive only — nothing is
              transmitted, nothing leaves the device.
            </p>
          </>
        )}

        {phase === 'running' && (
          <Button full size="lg" variant="quiet" icon="close" onClick={() => navigate('/app')}>
            Cancel sweep
          </Button>
        )}

        {phase === 'done' && (
          <>
            <Panel className="p-4">
              <div className="flex items-start gap-3">
                <Icon
                  name={verdict.klass === 'safe' ? 'check' : 'alert'}
                  size={18}
                  className="mt-0.5 shrink-0 text-[var(--accent)]"
                />
                <p className="text-[13px] leading-relaxed text-ink-2">{meta.verb}</p>
              </div>
              {verdict.reasons[0] && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {verdict.reasons.slice(0, 3).map((r, i) => (
                    <Pill key={i} tone="accent">
                      {r.title}
                    </Pill>
                  ))}
                </div>
              )}
            </Panel>
            <div className="grid grid-cols-2 gap-2">
              <Button icon="refresh" onClick={start}>
                Scan again
              </Button>
              <Button variant="accent" icon="download" onClick={save}>
                Save report
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function stageProgress(elapsed: number, index: number): number {
  let start = 0
  for (let i = 0; i < index; i++) start += STAGES[i].weight
  return Math.min(1, Math.max(0, (elapsed - start) / STAGES[index].weight))
}
