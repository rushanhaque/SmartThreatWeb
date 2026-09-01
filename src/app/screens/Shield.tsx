import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApertureRing, EvidenceStack, Sparkline } from '@/components/viz'
import { Button, Label, Panel, PanelHeader, Pill, Row, cx } from '@/components/ui'
import { Icon, type IconName } from '@/components/Icon'
import { actions, selDevices, selFrames, selPrefs, selVerdict, useSelect } from '@/engine/store'
import { CLASS_META } from '@/engine/fusion'
import { SCENARIOS } from '@/engine/simulator'
import type { FusionChannel, Reason } from '@/engine/types'
import { pct, proximityLabel } from '@/lib/format'
import { useSpringNumber } from '@/lib/hooks'
import { gsap, useGsap, revealChildren } from '@/lib/motion'

const CHANNEL_ICON: Record<FusionChannel, IconName> = {
  camera: 'camera',
  tracker: 'tag',
  rf: 'radio',
  emf: 'bolt',
  dark: 'moon',
}

export function Shield() {
  const verdict  = useSelect(selVerdict)
  const devices  = useSelect(selDevices)
  const frames   = useSelect(selFrames)
  const prefs    = useSelect(selPrefs)
  const navigate = useNavigate()

  const shown   = useSpringNumber(verdict.score)
  const meta    = CLASS_META[verdict.klass]
  const top     = verdict.reasons.slice(0, 3)
  const unknown = devices.filter((d) => d.trust === 'unknown').length
  const last    = frames[frames.length - 1]
  const rfTrail = useMemo(() => frames.slice(-40).map((f) => f.rfDbm), [frames])

  const root = useGsap((_, scope) => {
    // hero text + button entrance (ring has its own CSS anim)
    gsap.from(scope.querySelectorAll('.shield-hero-body'), {
      y: 24, opacity: 0, stagger: 0.12, duration: 0.75, ease: 'expo.out', delay: 0.18,
    })
    // panels below hero — stagger reveal on scroll
    scope.querySelectorAll<HTMLElement>('section:not(.shield-hero)').forEach((sec) => {
      revealChildren(sec, ':scope > *', { stagger: 0.09, y: 20 })
    })
    // scenario cards
    revealChildren(scope, '.scenario-card', { stagger: 0.07, y: 18, start: 'top 85%' })
  })

  return (
    <div ref={root} className="pb-6">
      {/* ── Primary readout ──────────────────────────────────────── */}
      <section className="shield-hero flex flex-col items-center px-5 pt-7 pb-6">
        <ApertureRing score={verdict.score} klass={verdict.klass} scanning={prefs.scanning}>
          <div className="readout text-[62px] font-semibold leading-none tracking-[-0.05em] text-ink">
            {Math.round(shown)}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
              style={{
                animation:
                  verdict.klass === 'threat'
                    ? 'aperture-pulse .9s ease-in-out infinite'
                    : verdict.klass === 'caution'
                      ? 'aperture-pulse 1.8s ease-in-out infinite'
                      : 'none',
              }}
            />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--accent)]">
              {meta.label}
            </span>
          </div>
          <Label className="mt-2">CONF {pct(verdict.confidence)}</Label>
        </ApertureRing>

        <p className="shield-hero-body mt-5 max-w-[30ch] text-center text-[14px] leading-relaxed text-ink-2">
          {meta.verb}
        </p>

        {/* Scan toggle */}
        <Button
          className="shield-hero-body mt-4"
          variant={prefs.scanning ? 'quiet' : 'accent'}
          icon={prefs.scanning ? 'pause' : 'play'}
          onClick={() => actions.toggleScanning()}
        >
          {prefs.scanning ? 'Pause scanning' : 'Resume scanning'}
        </Button>
      </section>

      {/* ── Evidence chain ───────────────────────────────────────── */}
      <section className="px-4">
        <Panel>
          <PanelHeader
            title="WHY THIS READING"
            hint={top.length ? `${verdict.reasons.length} corroborating signals` : 'No channel is above its noise floor'}
            action={<Pill tone="accent" icon="target">{meta.short}</Pill>}
          />
          {top.length ? (
            <ol className="relative px-4 pb-1">
              {top.map((r, i) => (
                <EvidenceItem key={r.code + i} reason={r} last={i === top.length - 1} />
              ))}
            </ol>
          ) : (
            <p className="px-4 pb-4 text-[13px] leading-relaxed text-ink-3">
              Every channel is sitting at baseline. The glasses keep listening at the normal
              five-second cadence — you will feel a buzz before you need to look at this screen.
            </p>
          )}
        </Panel>
      </section>

      {/* ── Fusion breakdown ─────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader
            title="FUSION BREAKDOWN"
            hint="Channel strength × its fixed weight"
            action={<Label>Σ {verdict.score}/100</Label>}
          />
          <EvidenceStack breakdown={verdict.breakdown} />
        </Panel>
      </section>

      {/* ── Live sensors ─────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel className="overflow-hidden">
          <PanelHeader title="SENSORS" hint="500 ms cadence · on-device only" />
          <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
            <SensorCell label="RF POWER" value={last.rfDbm.toFixed(0)} unit="dBm" trail={rfTrail} />
            <SensorCell label="EM FIELD" value={last.emfMg.toFixed(1)} unit="mG"  trail={frames.slice(-40).map((f) => f.emfMg)} />
            <SensorCell label="AMBIENT"  value={Math.round(last.lux).toString()}   unit="lux" trail={frames.slice(-40).map((f) => f.lux)} />
          </div>
        </Panel>
      </section>

      {/* ── Devices summary ──────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <Row
            onClick={() => navigate('/devices')}
            icon={
              <div className="grid h-9 w-9 place-items-center rounded-sm border border-line bg-bg-2 text-ink-2">
                <Icon name="radio" size={17} />
              </div>
            }
            title={`${devices.length} radios in range`}
            sub={
              unknown
                ? `${unknown} unidentified · nearest ${proximityLabel(Math.max(...devices.map((d) => d.rssi)))}`
                : 'All matched to your trusted list'
            }
            right={
              <div className="flex items-center gap-2">
                {devices.some((d) => d.signals.includes('camera-oui')) && (
                  <Pill tone="accent" icon="camera">CAM</Pill>
                )}
                <Icon name="chevron-right" size={16} className="text-ink-4" />
              </div>
            }
          />
        </Panel>
      </section>

      {/* ── Demo environments ────────────────────────────────────── */}
      <section className="mt-6">
        <div className="flex items-end justify-between px-5 pb-2.5">
          <Label>DEMO ENVIRONMENTS</Label>
          <span className="micro text-ink-4">SWIPE →</span>
        </div>
        <div className="rail no-scrollbar gap-2.5 px-4 pb-1">
          {SCENARIOS.map((s) => {
            const active = s.id === prefs.scenario
            return (
              <button
                key={s.id}
                onClick={() => actions.setScenario(s.id)}
                className={cx(
                  'scenario-card press w-[210px] rounded-md border p-3.5 text-left',
                  active
                    ? 'border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[var(--accent-soft)]'
                    : 'border-line bg-surface/60 hover:border-line-2',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cx('text-[13px] font-semibold', active ? 'text-[var(--accent)]' : 'text-ink')}>
                    {s.name}
                  </span>
                  {active && <Icon name="check" size={14} className="text-[var(--accent)]" />}
                </div>
                <p className="mt-1.5 text-[11.5px] leading-snug text-ink-3">{s.blurb}</p>
              </button>
            )
          })}
        </div>
      </section>

      <p className="mt-6 px-6 text-center text-[11.5px] leading-relaxed text-ink-3">
        PG-1 is an aid, not a guarantee. If you believe you are being recorded or followed,
        preserve the scene and contact the police.
      </p>
    </div>
  )
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function EvidenceItem({ reason, last }: { reason: Reason; last: boolean }) {
  return (
    <li className="relative flex gap-3 pb-4">
      {!last && <span aria-hidden className="absolute top-8 bottom-0 left-[15px] w-px bg-line" />}
      <div className="relative z-[1] grid h-[31px] w-[31px] shrink-0 place-items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_34%,transparent)] bg-[var(--accent-soft)] text-[var(--accent)]">
        <Icon name={CHANNEL_ICON[reason.channel]} size={15} />
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13.5px] font-medium text-ink">{reason.title}</span>
          <span className="micro shrink-0">{reason.code}</span>
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{reason.detail}</p>
      </div>
    </li>
  )
}

function SensorCell({ label, value, unit, trail }: { label: string; value: string; unit: string; trail: number[] }) {
  return (
    <div className="px-3.5 py-3">
      <Label>{label}</Label>
      <div className="readout mt-1.5 flex items-baseline gap-1">
        <span className="text-[18px] font-semibold leading-none">{value}</span>
        <span className="text-[10px] text-ink-3">{unit}</span>
      </div>
      <Sparkline data={trail} width={78} height={18} className="mt-2 opacity-80" />
    </div>
  )
}
