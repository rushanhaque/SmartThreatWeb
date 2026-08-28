/* ============================================================================
   SETTINGS
   ----------------------------------------------------------------------------
   Ordered by how often it is touched, not by engineering tidiness: the device
   you are paired to, then how loudly it should interrupt you, then how eager
   it should be, then the privacy posture, then the parts only a developer
   opens. Every toggle states its cost — sensitivity that buys false positives,
   an active probe that stops being passive — because a security control whose
   trade-off is hidden gets set wrong.
   ========================================================================== */

import { useNavigate } from 'react-router-dom'
import { Button, Divider, Label, Panel, PanelHeader, Pill, Segmented, Switch, cx } from '@/components/ui'
import { Icon, type IconName } from '@/components/Icon'
import { actions, selHw, selPrefs, useSelect } from '@/engine/store'
import { SCENARIOS } from '@/engine/simulator'
import { duration } from '@/lib/format'
import type { AlertChannel } from '@/engine/types'

const ALERT_ROWS: Array<{ id: AlertChannel; title: string; body: string; icon: IconName }> = [
  { id: 'oled', title: 'Lens display', body: 'Colour-coded state in the corner of your vision.', icon: 'glasses' },
  { id: 'haptic', title: 'Temple haptics', body: 'One tap for watch, two long for threat.', icon: 'waves' },
  { id: 'buzzer', title: 'Buzzer', body: 'Audible. Fires on threat only — never in a quiet room by accident.', icon: 'bell' },
  { id: 'push', title: 'Phone notification', body: 'Full detail with the device list and the reasoning.', icon: 'bolt' },
]

export default function Settings() {
  const prefs = useSelect(selPrefs)
  const hw = useSelect(selHw)
  const navigate = useNavigate()

  return (
    <div className="pb-8 t-neutral">
      <div className="px-5 pt-6 pb-4">
        <h1 className="display-3">Settings</h1>
      </div>

      {/* ── Device ───────────────────────────────────────────────── */}
      <section className="px-4">
        <Panel>
          <PanelHeader
            title="PAIRED DEVICE"
            hint={hw.serial}
            action={
              <Pill tone="accent" icon={hw.connected ? 'link' : 'close'}>
                {hw.connected ? 'Linked' : 'Offline'}
              </Pill>
            }
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line px-4 py-4">
            <Meter label="BATTERY" value={hw.batteryPct} unit="%" pct={hw.batteryPct / 100} />
            <Meter label="STORAGE" value={hw.storageUsedPct} unit="% used" pct={hw.storageUsedPct / 100} />
            <KV label="LINK" value={`${hw.linkRssi} dBm`} />
            <KV label="TEMPERATURE" value={`${hw.temperatureC.toFixed(1)} °C`} />
            <KV label="FIRMWARE" value={hw.firmware} />
            <KV label="UPTIME" value={duration(hw.uptimeSec * 1000)} />
          </div>
          <Divider />
          <div className="flex gap-2 p-4">
            <Button className="flex-1" icon="refresh">
              Check for firmware
            </Button>
            <Button className="flex-1" variant="ghost" icon="link">
              Re-pair
            </Button>
          </div>
        </Panel>
      </section>

      {/* ── Model ────────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="CLASSIFIER" hint="Runs entirely on the glasses" />
          <div className="space-y-3 px-4 pb-4">
            <KV label="MODEL" value={hw.modelVersion} />
            <KV label="TREES" value="100 · emlearn → C" />
            <KV label="FEATURES" value="10 per 30 s window" />
            <KV label="TRAINING SET" value="1,240 labelled windows" />
          </div>
          <Divider />
          <div className="p-4">
            <Button full variant="ghost" icon="download">
              Update model over BLE
            </Button>
          </div>
        </Panel>
      </section>

      {/* ── Alerts ───────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="HOW IT REACHES YOU" hint="Independent channels" />
          <div className="px-4 pb-2">
            {ALERT_ROWS.map((r) => (
              <div key={r.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                <Icon name={r.icon} size={17} className="shrink-0 text-ink-3" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-ink">{r.title}</div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-3">{r.body}</p>
                </div>
                <Switch
                  checked={prefs.channels[r.id]}
                  onChange={(v) => actions.setPrefs({ channels: { ...prefs.channels, [r.id]: v } })}
                  label={r.title}
                />
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* ── Detection ────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="SENSITIVITY" hint="Shifts the threshold, not the evidence" />
          <div className="px-4 pb-4">
            <Segmented
              value={prefs.sensitivity}
              onChange={(v) => actions.setPrefs({ sensitivity: v })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'high', label: 'High' },
              ]}
            />
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
              {prefs.sensitivity === 'low' &&
                'Only corroborated findings raise an alert. Fewest interruptions, and the highest chance of missing a quiet device.'}
              {prefs.sensitivity === 'balanced' &&
                'The tuned default. Roughly one false positive per twelve hours in a dense environment, in our own field testing.'}
              {prefs.sensitivity === 'high' &&
                'Single-channel hits will alert. Appropriate in a hotel or an unfamiliar room; noisy on a train.'}
            </p>
          </div>

          <Divider />

          <ToggleRow
            title="Dark-room boost"
            body="Raise the RF sample rate below 15 lux, where IR-capable optics are most effective."
            checked={prefs.darkBoost}
            onChange={(v) => actions.setPrefs({ darkBoost: v })}
          />
          <ToggleRow
            title="Auto deep scan on arrival"
            body="Run the 90-second sweep automatically when you enter a place you have not scanned before."
            checked={prefs.autoDeepScan}
            onChange={(v) => actions.setPrefs({ autoDeepScan: v })}
          />
          <ToggleRow
            title="Passive only"
            body="Never send a packet. Disables port checks and mDNS queries, which are the only active probes in the system."
            checked={prefs.passiveOnly}
            onChange={(v) => actions.setPrefs({ passiveOnly: v })}
            last
          />
        </Panel>
      </section>

      {/* ── Privacy ──────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="PRIVACY" hint="The posture, stated plainly" />
          <ul className="space-y-2.5 px-4 pb-4">
            {[
              ['No camera, no microphone', 'The glasses cannot record you or anyone else. There is no image sensor on the board.'],
              ['No account, no cloud', 'Nothing syncs. There is no server that could be breached or subpoenaed.'],
              ['Metadata only', 'Addresses, signal strengths and timings. Never packet contents — that would be interception.'],
              ['Local retention', 'Logs roll at 20,000 entries on the glasses and are yours to delete at any time.'],
            ].map(([t, b]) => (
              <li key={t} className="flex gap-2.5">
                <Icon name="check" size={14} className="mt-1 shrink-0 text-safe" />
                <div>
                  <div className="text-[13px] font-medium text-ink">{t}</div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-3">{b}</p>
                </div>
              </li>
            ))}
          </ul>
          <Divider />
          <div className="space-y-2 p-4">
            <Button full variant="ghost" icon="download">
              Export everything
            </Button>
            <Button full variant="danger" icon="trash">
              Erase all local data
            </Button>
          </div>
        </Panel>
      </section>

      {/* ── Demo ─────────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="DEMO ENVIRONMENT" hint="Drives the simulated telemetry" />
          <div className="px-4 pb-4">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => actions.setScenario(s.id)}
                className={cx(
                  'press flex w-full items-start gap-3 border-b border-line py-3 text-left last:border-0',
                )}
              >
                <span
                  className={cx(
                    'mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border',
                    prefs.scenario === s.id ? 'border-[var(--accent)]' : 'border-line-2',
                  )}
                >
                  {prefs.scenario === s.id && (
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink">{s.name}</div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-3">{s.blurb}</p>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </section>

      {/* ── About ────────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="ABOUT" />
          <div className="space-y-3 px-4 pb-4">
            <KV label="APP" value="Companion 0.1.0" />
            <KV label="PROTOCOL" value="PG-BLE v1 · 20 B MTU" />
            <KV label="LICENCE" value="Academic prototype" />
          </div>
          <Divider />
          <div className="space-y-2 p-4">
            <Button full variant="ghost" icon="glasses" onClick={() => navigate('/')}>
              About the project
            </Button>
            <Button
              full
              variant="ghost"
              icon="refresh"
              onClick={() => {
                actions.resetOnboarding()
                navigate('/onboarding')
              }}
            >
              Replay first-run setup
            </Button>
          </div>
        </Panel>
      </section>

      <p className="mt-6 px-6 text-center text-[11.5px] leading-relaxed text-ink-4">
        PG-1 is a detection aid built as a final-year engineering project. It does not guarantee
        that a space is free of surveillance.
      </p>
    </div>
  )
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Label>{label}</Label>
      <span className="readout truncate text-[12.5px] text-ink-2">{value}</span>
    </div>
  )
}

function Meter({
  label,
  value,
  unit,
  pct,
}: {
  label: string
  value: number
  unit: string
  pct: number
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="readout mt-1.5 flex items-baseline gap-1">
        <span className="text-[19px] font-semibold leading-none">{value}</span>
        <span className="text-[10px] text-ink-3">{unit}</span>
      </div>
      <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-[var(--accent)]"
          style={{ width: `${pct * 100}%`, transition: 'width .6s var(--ease-out-expo)' }}
        />
      </div>
    </div>
  )
}

function ToggleRow({
  title,
  body,
  checked,
  onChange,
  last,
}: {
  title: string
  body: string
  checked: boolean
  onChange: (v: boolean) => void
  last?: boolean
}) {
  return (
    <div
      className={cx('flex items-center gap-3 px-4 py-3.5', !last && 'border-b border-line')}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium text-ink">{title}</div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-3">{body}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  )
}
