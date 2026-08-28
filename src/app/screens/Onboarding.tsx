/* ============================================================================
   FIRST RUN
   ----------------------------------------------------------------------------
   Five steps, because five things genuinely have to happen before the product
   works: you have to know what it is, grant it the radios, pair the hardware,
   let it learn your normal, and choose how loud it should be.

   Nothing here is a carousel of value propositions. Each step either takes a
   permission, performs a task, or captures a setting the engine needs.
   ========================================================================== */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Label, Panel, Pill, cx } from '@/components/ui'
import { Icon, type IconName } from '@/components/Icon'
import { Logomark, PG1Glasses } from '@/components/Brand'
import { ApertureRing } from '@/components/viz'
import { actions } from '@/engine/store'
import { haptic } from '@/lib/hooks'

type StepId = 'intro' | 'permissions' | 'pair' | 'baseline' | 'alerts'
const ORDER: StepId[] = ['intro', 'permissions', 'pair', 'baseline', 'alerts']

export default function Onboarding() {
  const [step, setStep] = useState<StepId>('intro')
  const navigate = useNavigate()
  const index = ORDER.indexOf(step)

  const next = useCallback(() => {
    haptic('tap')
    const i = ORDER.indexOf(step)
    if (i < ORDER.length - 1) setStep(ORDER[i + 1])
    else {
      actions.completeOnboarding()
      navigate('/app')
    }
  }, [step, navigate])

  return (
    <div className="flex min-h-dvh flex-col bg-bg t-neutral">
      {/* ── Progress ─────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-2"
        style={{ paddingTop: 'calc(1rem + var(--spacing-safe-t))' }}
      >
        <Logomark size={22} active />
        <div className="flex flex-1 gap-1.5">
          {ORDER.map((s, i) => (
            <span
              key={s}
              className={cx(
                'h-[3px] flex-1 rounded-full',
                i <= index ? 'bg-[var(--accent)]' : 'bg-surface-3',
              )}
              style={{ transition: 'background-color .4s var(--ease-out-quart)' }}
            />
          ))}
        </div>
        <button
          onClick={() => {
            actions.completeOnboarding()
            navigate('/app')
          }}
          className="press text-[12.5px] text-ink-3"
        >
          Skip
        </button>
      </div>

      <div key={step} className="anim-rise flex min-h-0 flex-1 flex-col">
        {step === 'intro' && <Intro />}
        {step === 'permissions' && <Permissions />}
        {step === 'pair' && <Pair />}
        {step === 'baseline' && <Baseline />}
        {step === 'alerts' && <Alerts />}
      </div>

      <div
        className="shrink-0 px-4 pt-3"
        style={{ paddingBottom: 'calc(1.25rem + var(--spacing-safe-b))' }}
      >
        <Button full size="lg" variant="accent" onClick={next} iconAfter="chevron-right">
          {step === 'alerts' ? 'Start protecting me' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}

/* ── Step 1 ──────────────────────────────────────────────────────────────── */

function Intro() {
  return (
    <div className="flex flex-1 flex-col justify-center px-5">
      <div className="-mx-5 mb-8">
        <PG1Glasses scanning className="w-full" />
      </div>
      <Label>PG-1 · FIRST RUN</Label>
      <h1 className="display-2 mt-3">
        Five sensors.
        <br />
        One question.
      </h1>
      <p className="mt-4 text-[14.5px] leading-relaxed text-ink-2">
        Is anything in this room watching you? Wi-Fi, Bluetooth, radio power, electromagnetic
        field and ambient light are read together, because none of them is convincing alone.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {['Hidden cameras', 'Bluetooth trackers', 'RF bugs', 'Unknown radios'].map((t) => (
          <Pill key={t} tone="neutral">
            {t}
          </Pill>
        ))}
      </div>
    </div>
  )
}

/* ── Step 2 ──────────────────────────────────────────────────────────────── */

const PERMS: Array<{ icon: IconName; title: string; body: string; required: boolean }> = [
  {
    icon: 'bluetooth',
    title: 'Bluetooth',
    body: 'Talks to the glasses, and reads tracker advertisements the glasses cannot decode alone.',
    required: true,
  },
  {
    icon: 'pin',
    title: 'Coarse location',
    body: 'Android ties Wi-Fi and BLE scanning to this permission. Used only to tell "moved" from "stayed" — never stored as a track.',
    required: true,
  },
  {
    icon: 'bell',
    title: 'Notifications',
    body: 'So a threat reaches you when the phone is in your pocket.',
    required: false,
  },
  {
    icon: 'camera',
    title: 'Camera',
    body: 'Only for the lens finder, and only while that screen is open.',
    required: false,
  },
]

function Permissions() {
  return (
    <div className="flex-1 overflow-y-auto px-5 pt-6">
      <Label>STEP 2 · ACCESS</Label>
      <h1 className="display-3 mt-3">What it needs, and why</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
        Four permissions, two of them optional. Nothing is requested that is not used by a feature
        you can point at.
      </p>
      <div className="mt-5 space-y-2">
        {PERMS.map((p) => (
          <Panel key={p.title} className="flex gap-3 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-line bg-bg-2 text-ink-2">
              <Icon name={p.icon} size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-medium text-ink">{p.title}</span>
                <span className="micro">{p.required ? 'REQUIRED' : 'OPTIONAL'}</span>
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{p.body}</p>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

/* ── Step 3 ──────────────────────────────────────────────────────────────── */

function Pair() {
  const [state, setState] = useState<'searching' | 'found' | 'linked'>('searching')

  useEffect(() => {
    const a = setTimeout(() => setState('found'), 1500)
    const b = setTimeout(() => {
      setState('linked')
      haptic('success')
    }, 3200)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
      <div className={state === 'linked' ? 't-safe' : 't-neutral'}>
        <ApertureRing score={state === 'linked' ? 100 : state === 'found' ? 55 : 18} klass="safe" size={210}>
          <Icon
            name={state === 'linked' ? 'check' : 'bluetooth'}
            size={34}
            className="text-[var(--accent)]"
          />
          <Label className="mt-3">
            {state === 'searching' ? 'SEARCHING' : state === 'found' ? 'FOUND' : 'LINKED'}
          </Label>
        </ApertureRing>
      </div>

      <h1 className="display-3 mt-6">
        {state === 'linked' ? 'PG-1 is connected' : 'Looking for your glasses'}
      </h1>
      <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-ink-2">
        {state === 'linked'
          ? 'Firmware 0.9.4-rc2, battery 78%, classifier rf100-v7. Everything checks out.'
          : 'Make sure the temple switch is on and the status LED is breathing blue.'}
      </p>

      {state === 'linked' && (
        <div className="mt-5 grid w-full max-w-[300px] grid-cols-3 gap-2">
          {[
            ['SERIAL', 'PG1-24B'],
            ['LINK', '−54 dBm'],
            ['BATTERY', '78%'],
          ].map(([l, v]) => (
            <div key={l} className="rounded-sm border border-line bg-surface/60 px-2.5 py-2.5">
              <Label>{l}</Label>
              <div className="readout mt-1 text-[12.5px] text-ink">{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Step 4 ──────────────────────────────────────────────────────────────── */

function Baseline() {
  const [progress, setProgress] = useState(0)
  const [found, setFound] = useState<string[]>([])

  useEffect(() => {
    const names = ['Verma_5G', 'Living-room TV', 'pihole.local', 'Porch light', 'AirPods Pro']
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 4200)
      setProgress(p)
      setFound(names.slice(0, Math.floor(p * names.length + 0.5)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="flex flex-1 flex-col px-5 pt-6">
      <Label>STEP 4 · CALIBRATION</Label>
      <h1 className="display-3 mt-3">Learning your normal</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
        Stand still for thirty seconds somewhere you trust. Everything the glasses can hear right
        now becomes the baseline they measure every other room against.
      </p>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <Label>CAPTURING BASELINE</Label>
          <span className="readout text-[12.5px] text-[var(--accent)]">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex-1 space-y-1.5 overflow-y-auto">
        {found.map((n) => (
          <div
            key={n}
            className="anim-rise flex items-center gap-2.5 rounded-sm border border-line bg-surface/60 px-3.5 py-2.5"
          >
            <Icon name="check" size={14} className="shrink-0 text-safe" />
            <span className="flex-1 truncate text-[13px] text-ink">{n}</span>
            <span className="micro">TRUSTED</span>
          </div>
        ))}
      </div>

      <p className="pt-3 text-[12px] leading-relaxed text-ink-4">
        Trusted radios are excluded from scoring. You can untrust any of them later, and the
        baseline can be recaptured whenever you move house.
      </p>
    </div>
  )
}

/* ── Step 5 ──────────────────────────────────────────────────────────────── */

function Alerts() {
  const [choice, setChoice] = useState<'low' | 'balanced' | 'high'>('balanced')

  const OPTIONS = [
    { id: 'low' as const, title: 'Only when certain', body: 'Two or more channels must agree. Quietest.' },
    { id: 'balanced' as const, title: 'Balanced', body: 'The tuned default. Recommended for most people.' },
    { id: 'high' as const, title: 'Tell me everything', body: 'Single-channel hits alert. Good in a hotel, noisy on a train.' },
  ]

  return (
    <div className="flex flex-1 flex-col px-5 pt-6">
      <Label>STEP 5 · INTERRUPTION</Label>
      <h1 className="display-3 mt-3">How loud should it be?</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
        This moves the threshold, not the evidence. Every reading is still recorded in full — you
        are choosing when it is worth interrupting you.
      </p>

      <div className="mt-6 space-y-2">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => {
              setChoice(o.id)
              actions.setPrefs({ sensitivity: o.id })
              haptic('tap')
            }}
            className={cx(
              'press flex w-full gap-3 rounded-md border p-4 text-left',
              choice === o.id
                ? 'border-[color-mix(in_srgb,var(--accent)_42%,transparent)] bg-[var(--accent-soft)]'
                : 'border-line bg-surface/60',
            )}
          >
            <span
              className={cx(
                'mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border',
                choice === o.id ? 'border-[var(--accent)]' : 'border-line-2',
              )}
              style={{ width: 18, height: 18 }}
            >
              {choice === o.id && <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />}
            </span>
            <div>
              <div className="text-[14px] font-medium text-ink">{o.title}</div>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-3">{o.body}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-auto pt-6 text-[11.5px] leading-relaxed text-ink-4">
        PG-1 is an aid, not a guarantee. It cannot see a camera that records to an SD card and
        never transmits — use the lens finder for those.
      </p>
    </div>
  )
}
