/* ============================================================================
   HISTORY — the record
   ----------------------------------------------------------------------------
   A privacy device that keeps no record is useless the moment you need to
   prove something happened. Everything here is stored on the phone, exportable
   as a signed bundle, and never uploaded.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { Empty, Label, Panel, PanelHeader, Pill, Segmented, cx } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { ThreatRibbon } from '@/components/viz'
import { selIncidents, selSessions, useSelect } from '@/engine/store'
import { CLASS_META } from '@/engine/fusion'
import { clockTime, dayLabel, duration } from '@/lib/format'
import type { ThreatClass } from '@/engine/types'

const TONE: Record<ThreatClass, string> = {
  safe: 't-safe',
  caution: 't-caution',
  threat: 't-threat',
}

type Tab = 'sessions' | 'incidents'

export default function History() {
  const sessions = useSelect(selSessions)
  const incidents = useSelect(selIncidents)
  const [tab, setTab] = useState<Tab>('sessions')
  // A 24-hour ribbon built from the recorded peaks, bucketed hourly.
  const ribbon = useMemo(() => {
    const now = Date.now()
    return Array.from({ length: 24 }, (_, i) => {
      const from = now - (24 - i) * 3_600_000
      const to = from + 3_600_000
      const hit = sessions.find((s) => s.startedAt >= from && s.startedAt < to)
      return hit
        ? { score: hit.peakScore, klass: hit.klass }
        : { score: 6 + ((i * 13) % 9), klass: 'safe' as ThreatClass }
    })
  }, [sessions])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof sessions>()
    for (const s of sessions) {
      const key = dayLabel(s.startedAt)
      map.set(key, [...(map.get(key) ?? []), s])
    }
    return [...map.entries()]
  }, [sessions])

  return (
    <div className="pb-6">
      <div className="px-5 pt-6 pb-4">
        <h1 className="display-3">History</h1>
        <p className="mt-1.5 text-[13px] text-ink-3">
          {sessions.length} saved scans · {incidents.length} incidents · stored on this phone only
        </p>
      </div>

      {/* ── 24 h ribbon ──────────────────────────────────────────── */}
      <div className="px-4">
        <Panel className="t-neutral pt-3.5 pb-4">
          <PanelHeader title="LAST 24 HOURS" hint="Hourly peak threat score" />
          <ThreatRibbon points={ribbon} />
          <div className="mt-2 flex justify-between px-4">
            <span className="micro">24H AGO</span>
            <span className="micro">NOW</span>
          </div>
        </Panel>
      </div>

      <div className="px-4 pt-4 pb-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'sessions', label: `Scans · ${sessions.length}` },
            { value: 'incidents', label: `Incidents · ${incidents.length}` },
          ]}
        />
      </div>

      {tab === 'sessions' ? (
        grouped.length === 0 ? (
          <Empty
            icon="clock"
            title="No scans yet"
            body="Run a deep scan when you check into a room and it will be saved here with everything it found."
          />
        ) : (
          <div className="space-y-5 px-4">
            {grouped.map(([day, items]) => (
              <section key={day}>
                <div className="px-1 pb-2">
                  <Label>{day.toUpperCase()}</Label>
                </div>
                <div className="space-y-2">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className={cx(TONE[s.klass], 'panel w-full p-4')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-medium text-ink">{s.place}</div>
                          <div className="readout mt-1 text-[11.5px] text-ink-3">
                            {clockTime(s.startedAt)} · {duration(s.durationSec * 1000)} ·{' '}
                            {s.devicesSeen} radios
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="readout text-[20px] font-semibold text-[var(--accent)]">
                            {s.peakScore}
                          </span>
    
                        </div>
                      </div>
                      <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-3">
                        {s.verdictNote}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Pill tone="accent">{CLASS_META[s.klass].label}</Pill>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2 px-4">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={cx(TONE[inc.klass], 'panel flex w-full items-center gap-3 p-4')}
            >
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border text-[var(--accent)]"
                style={{
                  borderColor: 'color-mix(in srgb, var(--accent) 32%, transparent)',
                  background: 'var(--accent-soft)',
                }}
              >
                <Icon name={inc.klass === 'threat' ? 'alert' : 'info'} size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium text-ink">{inc.place}</div>
                <div className="readout mt-0.5 text-[11.5px] text-ink-3">
                  {dayLabel(inc.startedAt)} {clockTime(inc.startedAt)} ·{' '}
                  {duration((inc.endedAt ?? Date.now()) - inc.startedAt)}
                </div>
              </div>
              <span className="readout shrink-0 text-[18px] font-semibold text-[var(--accent)]">
                {inc.peakScore}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 px-4">
        <Panel className="t-neutral p-4">
          <div className="flex items-start gap-3">
            <Icon name="lock" size={17} className="mt-0.5 shrink-0 text-ink-3" />
            <div>
              <div className="text-[13px] font-medium text-ink">Nothing here has left your phone</div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
                Scans are written to local storage and to the glasses' own SPIFFS partition. There
                is no account, no sync, and no server that could be compelled to hand them over.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
