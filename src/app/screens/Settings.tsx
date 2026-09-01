import { Button, Divider, Label, Panel, PanelHeader, Pill, Segmented, Switch, cx } from '@/components/ui'
import { gsap, useGsap, revealChildren } from '@/lib/motion'
import { Icon, type IconName } from '@/components/Icon'
import { actions, selHw, selPrefs, useSelect } from '@/engine/store'
import { SCENARIOS } from '@/engine/simulator'
import { duration } from '@/lib/format'
import type { AlertChannel } from '@/engine/types'

const ALERT_ROWS: Array<{ id: AlertChannel; title: string; body: string; icon: IconName }> = [
  { id: 'oled',   title: 'Lens display',        body: 'Colour-coded state in the corner of your vision.', icon: 'glasses' },
  { id: 'haptic', title: 'Temple haptics',       body: 'One tap for caution, two long pulses for threat.',  icon: 'waves'   },
  { id: 'buzzer', title: 'Buzzer',               body: 'Audible alert on threat only.',                     icon: 'bell'    },
  { id: 'push',   title: 'Phone notification',   body: 'Full detail with device list and reasoning.',       icon: 'bolt'    },
]

export default function Settings() {
  const prefs = useSelect(selPrefs)
  const hw    = useSelect(selHw)

  const root = useGsap((_, scope) => {
    // page title
    gsap.from(scope.querySelector('.settings-title'), {
      y: 22, opacity: 0, duration: 0.75, ease: 'expo.out',
    })
    // each section staggered on scroll
    revealChildren(scope, 'section', { stagger: 0.1, y: 22, start: 'top 88%' })
    // footer note
    revealChildren(scope, '.settings-footer', { y: 14, start: 'top 95%' })
  })

  return (
    <div ref={root} className="pb-8 t-neutral">
      <div className="settings-title px-5 pt-6 pb-4">
        <h1 className="display-3">Settings</h1>
      </div>

      {/* ── Paired device ────────────────────────────────────────── */}
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
            <Meter label="BATTERY"  value={hw.batteryPct}      unit="%"      pct={hw.batteryPct / 100}      />
            <Meter label="STORAGE"  value={hw.storageUsedPct}  unit="% used" pct={hw.storageUsedPct / 100}  />
            <KV label="LINK"        value={`${hw.linkRssi} dBm`}             />
            <KV label="TEMPERATURE" value={`${hw.temperatureC.toFixed(1)} °C`} />
            <KV label="FIRMWARE"    value={hw.firmware}                      />
            <KV label="UPTIME"      value={duration(hw.uptimeSec * 1000)}    />
          </div>
          <Divider />
          <div className="flex gap-2 p-4">
            <Button className="flex-1" icon="refresh">Check for update</Button>
            <Button className="flex-1" variant="ghost" icon="link">Re-pair</Button>
          </div>
        </Panel>
      </section>

      {/* ── Alerts ───────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="ALERTS" hint="Independent channels" />
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

      {/* ── Sensitivity ──────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="SENSITIVITY" hint="Shifts the threshold, not the evidence" />
          <div className="px-4 pb-4">
            <Segmented
              value={prefs.sensitivity}
              onChange={(v) => actions.setPrefs({ sensitivity: v })}
              options={[
                { value: 'low',      label: 'Low'      },
                { value: 'balanced', label: 'Balanced' },
                { value: 'high',     label: 'High'     },
              ]}
            />
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
              {prefs.sensitivity === 'low'      && 'Only corroborated findings raise an alert. Fewest interruptions.'}
              {prefs.sensitivity === 'balanced' && 'The tuned default — roughly one false positive per twelve hours.'}
              {prefs.sensitivity === 'high'     && 'Single-channel hits will alert. Best for unfamiliar rooms.'}
            </p>
          </div>
          <Divider />
          <ToggleRow
            title="Dark-room boost"
            body="Raise RF sample rate below 15 lux, where IR optics are most effective."
            checked={prefs.darkBoost}
            onChange={(v) => actions.setPrefs({ darkBoost: v })}
          />
          <ToggleRow
            title="Passive only"
            body="Never send a packet. Disables port checks and mDNS queries."
            checked={prefs.passiveOnly}
            onChange={(v) => actions.setPrefs({ passiveOnly: v })}
            last
          />
        </Panel>
      </section>

      {/* ── Demo scenario ────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="DEMO SCENARIO" hint="Drives simulated telemetry" />
          <div className="px-4 pb-4">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => actions.setScenario(s.id)}
                className="press flex w-full items-start gap-3 border-b border-line py-3 text-left last:border-0"
              >
                <span className={cx(
                  'mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border',
                  prefs.scenario === s.id ? 'border-[var(--accent)]' : 'border-line-2',
                )}>
                  {prefs.scenario === s.id && <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />}
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
            <KV label="APP"      value="Companion 0.1.0"      />
            <KV label="PROTOCOL" value="PG-BLE v1 · 20 B MTU" />
            <KV label="LICENCE"  value="Academic prototype"    />
          </div>
        </Panel>
      </section>

      <p className="settings-footer mt-6 px-6 text-center text-[11.5px] leading-relaxed text-ink-3">
        PG-1 is a detection aid built as a final-year engineering project. It does not guarantee
        that a space is free of surveillance.
      </p>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Label>{label}</Label>
      <span className="readout truncate text-[12.5px] text-ink-2">{value}</span>
    </div>
  )
}

function Meter({ label, value, unit, pct }: { label: string; value: number; unit: string; pct: number }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="readout mt-1.5 flex items-baseline gap-1">
        <span className="text-[19px] font-semibold leading-none">{value}</span>
        <span className="text-[10px] text-ink-3">{unit}</span>
      </div>
      <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct * 100}%`, transition: 'width .6s var(--ease-out-expo)' }} />
      </div>
    </div>
  )
}

function ToggleRow({ title, body, checked, onChange, last }: {
  title: string; body: string; checked: boolean; onChange: (v: boolean) => void; last?: boolean
}) {
  return (
    <div className={cx('flex items-center gap-3 px-4 py-3.5', !last && 'border-b border-line')}>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium text-ink">{title}</div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-3">{body}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  )
}
