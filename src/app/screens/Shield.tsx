/* ============================================================================
   SHIELD — the home screen
   ----------------------------------------------------------------------------
   Answers three questions in descending order of urgency, top to bottom:
     1. Am I safe right now?        → the aperture ring, readable at a glance
     2. Why does it think that?     → the evidence chain, in plain sentences
     3. What should I do about it?  → actions, sized for a thumb
   Everything else on this screen is subordinate to that order.
   ========================================================================== */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApertureRing, EvidenceStack, Sparkline } from '@/components/viz'
import { Button, Label, Panel, PanelHeader, Pill, Row, cx } from '@/components/ui'
import { Icon, type IconName } from '@/components/Icon'
import {
  actions,
  selDevices,
  selFrames,
  selPrefs,
  selVerdict,
  useSelect,
} from '@/engine/store'
import { CLASS_META } from '@/engine/fusion'
import { SCENARIOS } from '@/engine/simulator'
import type { FusionChannel, Reason } from '@/engine/types'
import { ago, pct, proximityLabel } from '@/lib/format'
import { useSpringNumber } from '@/lib/hooks'

const CHANNEL_ICON: Record<FusionChannel, IconName> = {
  camera: 'camera',
  tracker: 'tag',
  rf: 'radio',
  emf: 'bolt',
  dark: 'moon',
}

export function Shield() {
  const verdict = useSelect(selVerdict)
  const devices = useSelect(selDevices)
  const frames = useSelect(selFrames)
  const prefs = useSelect(selPrefs)
  const navigate = useNavigate()

  const shown = useSpringNumber(verdict.score)
  const meta = CLASS_META[verdict.klass]
  const top = verdict.reasons.slice(0, 3)

  const unknown = devices.filter((d) => d.trust === 'unknown').length
  const last = frames[frames.length - 1]

  const rfTrail = useMemo(() => frames.slice(-40).map((f) => f.rfDbm), [frames])

  return (
    <div className="pb-6">
      {/* ── Primary readout ──────────────────────────────────────── */}
      <section className="flex flex-col items-center px-5 pt-7 pb-6">
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

        <p className="mt-5 max-w-[30ch] text-center text-[14px] leading-relaxed text-ink-2">
          {meta.verb}
        </p>
      </section>

      {/* ── Actions ──────────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-2 px-4">
        <ActionTile
          icon="scan"
          label="Deep scan"
          hint="90 s"
          onClick={() => navigate('/app/scan')}
          emphasis
        />
        <ActionTile icon="eye" label="Lens finder" hint="IR 940" onClick={() => navigate('/app/lens')} />
        <ActionTile
          icon={prefs.scanning ? 'pause' : 'play'}
          label={prefs.scanning ? 'Pause' : 'Resume'}
          hint={prefs.scanning ? 'Live' : 'Idle'}
          onClick={() => actions.toggleScanning()}
        />
      </section>

      {/* ── Evidence chain ───────────────────────────────────────── */}
      <section className="mt-5 px-4">
        <Panel>
          <PanelHeader
            title="WHY THIS READING"
            hint={
              top.length
                ? `${verdict.reasons.length} corroborating signals`
                : 'No channel is above its noise floor'
            }
            action={
              <Pill tone="accent" icon="target">
                {meta.short}
              </Pill>
            }
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

          {verdict.reasons.length > 3 && (
            <button
              onClick={() => navigate('/app/history/live')}
              className="press flex w-full items-center justify-between border-t border-line px-4 py-3 text-[13px] text-ink-2"
            >
              <span>See all {verdict.reasons.length} signals</span>
              <Icon name="chevron-right" size={15} className="text-ink-4" />
            </button>
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
          <PanelHeader
            title="SENSORS"
            hint="500 ms cadence · on-device only"
            action={
              <button
                onClick={() => navigate('/app/signals')}
                className="press micro flex items-center gap-1 text-ink-2"
              >
                EXPAND <Icon name="chevron-right" size={12} />
              </button>
            }
          />
          <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
            <SensorCell label="RF POWER" value={last.rfDbm.toFixed(0)} unit="dBm" trail={rfTrail} />
            <SensorCell label="EM FIELD" value={last.emfMg.toFixed(1)} unit="mG" trail={frames.slice(-40).map((f) => f.emfMg)} />
            <SensorCell label="AMBIENT" value={Math.round(last.lux).toString()} unit="lux" trail={frames.slice(-40).map((f) => f.lux)} />
          </div>
        </Panel>
      </section>

      {/* ── Devices summary ──────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <Row
            onClick={() => navigate('/app/devices')}
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
                  <Pill tone="accent" icon="camera">
                    CAM
                  </Pill>
                )}
                <Icon name="chevron-right" size={16} className="text-ink-4" />
              </div>
            }
          />
        </Panel>
      </section>

      {/* ── Demo environments ────────────────────────────────────
          Kept on the home screen deliberately: during the viva the examiner
          needs to see the engine change its mind, not read about it.       */}
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
                  'press w-[210px] rounded-md border p-3.5 text-left',
                  active
                    ? 'border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[var(--accent-soft)]'
                    : 'border-line bg-surface/60 hover:border-line-2',
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cx(
                      'text-[13px] font-semibold',
                      active ? 'text-[var(--accent)]' : 'text-ink',
                    )}
                  >
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

      <p className="mt-6 px-6 text-center text-[11.5px] leading-relaxed text-ink-4">
        PG-1 is an aid, not a guarantee. If you believe you are being recorded or followed,
        preserve the scene and contact the police.
      </p>
    </div>
  )
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function ActionTile({
  icon,
  label,
  hint,
  onClick,
  emphasis,
}: {
  icon: IconName
  label: string
  hint: string
  onClick: () => void
  emphasis?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'press flex flex-col items-start gap-3 rounded-md border p-3.5',
        emphasis
          ? 'border-[color-mix(in_srgb,var(--accent)_36%,transparent)] bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'border-line bg-surface/70 text-ink hover:border-line-2',
      )}
    >
      <Icon name={icon} size={19} />
      <div>
        <div className="text-[13px] font-semibold leading-tight">{label}</div>
        <div className="micro mt-1">{hint}</div>
      </div>
    </button>
  )
}

function EvidenceItem({ reason, last }: { reason: Reason; last: boolean }) {
  return (
    <li className="relative flex gap-3 pb-4">
      {/* connector — the chain-of-evidence spine */}
      {!last && (
        <span aria-hidden className="absolute top-8 bottom-0 left-[15px] w-px bg-line" />
      )}
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

function SensorCell({
  label,
  value,
  unit,
  trail,
}: {
  label: string
  value: string
  unit: string
  trail: number[]
}) {
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
