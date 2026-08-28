/* ============================================================================
   DEVICES — the census
   ----------------------------------------------------------------------------
   Two views over one dataset. The field plot answers "where is it?"; the list
   answers "what is it?". Both are wrong on their own, which is why the toggle
   sits at the top rather than a preference buried in settings.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty, Label, Panel, Pill, Segmented, cx } from '@/components/ui'
import { Icon, type IconName } from '@/components/Icon'
import { ProximityField, SignalBars, Sparkline } from '@/components/viz'
import { selDevices, useSelect } from '@/engine/store'
import type { Device } from '@/engine/types'
import { ago, proximityLabel, rssiBars, splitMac, throughput } from '@/lib/format'

type Filter = 'all' | 'unknown' | 'camera' | 'tracker' | 'trusted'

const FILTERS: Array<{ id: Filter; label: string; icon?: IconName }> = [
  { id: 'all', label: 'All' },
  { id: 'unknown', label: 'Unidentified' },
  { id: 'camera', label: 'Camera-like', icon: 'camera' },
  { id: 'tracker', label: 'Trackers', icon: 'tag' },
  { id: 'trusted', label: 'Trusted', icon: 'check' },
]

export function deviceTone(d: Device): 'safe' | 'caution' | 'threat' | 'muted' {
  if (d.trust === 'trusted') return 'safe'
  if (d.signals.includes('camera-oui') && d.signals.includes('streaming')) return 'threat'
  if (d.signals.includes('travelling')) return 'threat'
  if (d.signals.includes('camera-oui') || d.signals.includes('findmy')) return 'caution'
  if (d.signals.includes('tracker-proto') || d.signals.includes('hidden-ssid')) return 'caution'
  return 'muted'
}

const KIND_ICON: Record<Device['kind'], IconName> = {
  'wifi-ap': 'wifi',
  'wifi-sta': 'wifi',
  'ble-tag': 'tag',
  'ble-peripheral': 'bluetooth',
  'rf-emitter': 'radio',
}

const TONE_CLASS = {
  safe: 't-safe',
  caution: 't-caution',
  threat: 't-threat',
  muted: 't-neutral',
} as const

export default function Devices() {
  const devices = useSelect(selDevices)
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<'list' | 'field'>('list')
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return devices
      .filter((d) => {
        if (filter === 'unknown' && d.trust !== 'unknown') return false
        if (filter === 'trusted' && d.trust !== 'trusted') return false
        if (filter === 'camera' && !d.signals.includes('camera-oui')) return false
        if (
          filter === 'tracker' &&
          !d.signals.includes('findmy') &&
          !d.signals.includes('tracker-proto')
        )
          return false
        if (!term) return true
        return (
          d.mac.toLowerCase().includes(term) ||
          d.vendor.toLowerCase().includes(term) ||
          (d.label ?? '').toLowerCase().includes(term)
        )
      })
      .sort((a, b) => {
        // Risk first, then proximity. A quiet threat outranks a loud lamp.
        const rank = { threat: 0, caution: 1, muted: 2, safe: 3 }
        const diff = rank[deviceTone(a)] - rank[deviceTone(b)]
        return diff !== 0 ? diff : b.rssi - a.rssi
      })
  }, [devices, filter, q])

  const counts = useMemo(
    () => ({
      threat: devices.filter((d) => deviceTone(d) === 'threat').length,
      caution: devices.filter((d) => deviceTone(d) === 'caution').length,
    }),
    [devices],
  )

  return (
    <div className="pb-6">
      {/* ── Summary ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 px-5 pt-6 pb-4">
        <div>
          <h1 className="display-3">{devices.length} radios</h1>
          <p className="mt-1.5 text-[13px] text-ink-3">
            {counts.threat > 0
              ? `${counts.threat} behaving like surveillance`
              : counts.caution > 0
                ? `${counts.caution} worth a second look`
                : 'Nothing here matches a known threat pattern'}
          </p>
        </div>
        <Segmented
          className="w-[112px] shrink-0"
          value={view}
          onChange={setView}
          options={[
            { value: 'list', label: 'List' },
            { value: 'field', label: 'Field' },
          ]}
        />
      </div>

      {view === 'field' ? (
        <div className="px-4">
          <Panel className="pt-3 pb-4">
            <div className="px-4 pb-1">
              <Label>PROXIMITY FIELD</Label>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-3">
                Radius is derived from signal strength. Bearing is not measurable with a single
                antenna — the angle is stable, not directional.
              </p>
            </div>
            <ProximityField
              points={devices.map((d) => ({
                id: d.id,
                rssi: d.rssi,
                tone: deviceTone(d),
                label: deviceTone(d) === 'threat' ? d.vendor.split(' ')[0] : undefined,
              }))}
            />
            <div className="flex flex-wrap justify-center gap-3 px-4">
              {(
                [
                  ['threat', 'Threat'],
                  ['caution', 'Watch'],
                  ['safe', 'Trusted'],
                  ['muted', 'Ordinary'],
                ] as const
              ).map(([tone, label]) => (
                <span key={tone} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background:
                        tone === 'muted' ? 'var(--color-ink-4)' : `var(--color-${tone})`,
                    }}
                  />
                  <span className="micro">{label}</span>
                </span>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="px-4 pt-1">
        <div className="flex items-center gap-2.5 rounded-md border border-line bg-bg-2 px-3.5">
          <Icon name="search" size={16} className="shrink-0 text-ink-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="MAC, vendor or name"
            aria-label="Search devices"
            className="h-11 w-full bg-transparent text-[14px] outline-none placeholder:text-ink-4"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear" className="press text-ink-4">
              <Icon name="close" size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="rail no-scrollbar gap-2 px-4 py-3">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cx(
              'press inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium',
              filter === f.id
                ? 'border-line-3 bg-surface-2 text-ink'
                : 'border-line text-ink-3 hover:text-ink-2',
            )}
          >
            {f.icon && <Icon name={f.icon} size={13} />}
            {f.label}
          </button>
        ))}
      </div>

      {/* ── List ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Empty
          icon="search"
          title="Nothing matches"
          body="No radio in range fits that filter. Try widening it, or run a deep scan to force a fresh sweep."
        />
      ) : (
        <ul className="list-virtualish px-4">
          {filtered.map((d) => (
            <li key={d.id} className="mb-2">
              <DeviceCard device={d} onClick={() => navigate(`/app/devices/${d.id}`)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Device card ─────────────────────────────────────────────────────────── */

export function DeviceCard({ device: d, onClick }: { device: Device; onClick?: () => void }) {
  const tone = deviceTone(d)
  const [oui, rest] = splitMac(d.mac)
  const notable = tone === 'threat' || tone === 'caution'

  return (
    <button
      onClick={onClick}
      className={cx(
        TONE_CLASS[tone],
        'press panel w-full overflow-hidden p-0 text-left',
        notable && 'border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
      )}
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        <div
          className={cx(
            'grid h-10 w-10 shrink-0 place-items-center rounded-sm border',
            notable
              ? 'border-[color-mix(in_srgb,var(--accent)_34%,transparent)] bg-[var(--accent-soft)] text-[var(--accent)]'
              : 'border-line bg-bg-2 text-ink-3',
          )}
        >
          <Icon name={KIND_ICON[d.kind]} size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-medium text-ink">
              {d.label ?? d.vendor}
            </span>
            {d.trust === 'trusted' && <Icon name="check" size={13} className="shrink-0 text-safe" />}
          </div>
          <div className="readout mt-0.5 flex items-center gap-1.5 text-[11.5px]">
            <span className={notable ? 'text-[var(--accent)]' : 'text-ink-3'}>{oui}</span>
            <span className="text-ink-3">{rest}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <SignalBars bars={rssiBars(d.rssi)} />
            <span className="readout text-[12px] text-ink-2">{d.rssi}</span>
          </div>
          <div className="micro mt-1.5">{ago(d.firstSeen)} AGO</div>
        </div>
      </div>

      {/* Evidence strip — only drawn when there is evidence to show. */}
      {(d.signals.length > 0 || d.throughputKbps > 200) && (
        <div className="flex items-center gap-2 overflow-hidden border-t border-line bg-bg-2/60 px-3.5 py-2">
          <div className="flex flex-1 flex-wrap gap-1.5">
            {d.signals.includes('camera-oui') && (
              <Pill tone="accent" icon="camera">
                Camera OUI
              </Pill>
            )}
            {d.signals.includes('streaming') && (
              <Pill tone="accent">{throughput(d.throughputKbps)}</Pill>
            )}
            {d.signals.includes('rtsp-open') && <Pill tone="accent">554 open</Pill>}
            {d.signals.includes('findmy') && (
              <Pill tone="accent" icon="tag">
                FindMy
              </Pill>
            )}
            {d.signals.includes('travelling') && <Pill tone="accent">Following you</Pill>}
            {d.signals.includes('tracker-proto') && <Pill tone="muted">Tracker</Pill>}
            {d.signals.includes('hidden-ssid') && <Pill tone="muted">Hidden SSID</Pill>}
            {d.signals.includes('new-tonight') && <Pill tone="muted">New tonight</Pill>}
            {d.signals.includes('low-variance') && <Pill tone="muted">Fixed distance</Pill>}
          </div>
          <Sparkline data={d.rssiTrail} width={54} height={16} className="shrink-0 opacity-70" />
        </div>
      )}
    </button>
  )
}
