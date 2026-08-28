/* ============================================================================
   INCIDENT / SESSION REPORT
   ----------------------------------------------------------------------------
   The artefact you hand to a hotel manager, an employer, or the police. It has
   to survive being read by someone who has never used the product, so it
   states the finding, the evidence, and the limits of that evidence — in that
   order, in plain language.
   ========================================================================== */

import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Divider, Empty, Label, Panel, PanelHeader, Pill, Stat, cx } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { EvidenceStack } from '@/components/viz'
import { selDevices, selIncidents, selSessions, selVerdict, useSelect } from '@/engine/store'
import { CLASS_META } from '@/engine/fusion'
import { clockTime, dayLabel, duration } from '@/lib/format'
import { DeviceCard } from './Devices'

export default function Incident() {
  const { id = '' } = useParams()
  const sessions = useSelect(selSessions)
  const incidents = useSelect(selIncidents)
  const devices = useSelect(selDevices)
  const verdict = useSelect(selVerdict)
  const navigate = useNavigate()

  const record = useMemo(() => {
    if (id === 'live') {
      return {
        kind: 'live' as const,
        place: 'Current environment',
        startedAt: Date.now(),
        durationSec: 0,
        peakScore: verdict.score,
        klass: verdict.klass,
        note: CLASS_META[verdict.klass].verb,
        devicesSeen: devices.length,
      }
    }
    const s = sessions.find((x) => x.id === id)
    if (s)
      return {
        kind: 'session' as const,
        place: s.place,
        startedAt: s.startedAt,
        durationSec: s.durationSec,
        peakScore: s.peakScore,
        klass: s.klass,
        note: s.verdictNote,
        devicesSeen: s.devicesSeen,
      }
    const i = incidents.find((x) => x.id === id)
    if (i)
      return {
        kind: 'incident' as const,
        place: i.place,
        startedAt: i.startedAt,
        durationSec: Math.round(((i.endedAt ?? Date.now()) - i.startedAt) / 1000),
        peakScore: i.peakScore,
        klass: i.klass,
        note: CLASS_META[i.klass].verb,
        devicesSeen: i.deviceIds.length,
      }
    return null
  }, [id, sessions, incidents, verdict, devices.length])

  if (!record) {
    return (
      <Empty
        icon="clock"
        title="Record not found"
        body="This scan may have been cleared from local storage."
        action={
          <Button icon="arrow-left" onClick={() => navigate('/app/history')}>
            Back to history
          </Button>
        }
      />
    )
  }

  const meta = CLASS_META[record.klass]
  const notable = devices.filter(
    (d) => d.signals.length > 0 && d.trust !== 'trusted',
  )

  return (
    <div className={cx(meta.tone, 'pb-8')}>
      <div className="flex items-center px-2 pt-3">
        <button
          onClick={() => navigate(-1)}
          className="press flex h-10 items-center gap-1.5 rounded-sm px-2.5 text-[13px] text-ink-2"
        >
          <Icon name="arrow-left" size={17} />
          Back
        </button>
      </div>

      {/* ── Headline ─────────────────────────────────────────────── */}
      <section className="px-5 pt-2 pb-5">
        <Pill tone="accent" icon={record.klass === 'safe' ? 'check' : 'alert'}>
          {meta.label}
        </Pill>
        <h1 className="display-3 mt-3.5">{record.place}</h1>
        <div className="readout mt-2 text-[12.5px] text-ink-3">
          {dayLabel(record.startedAt)} · {clockTime(record.startedAt)}
          {record.durationSec > 0 && ` · ${duration(record.durationSec * 1000)}`}
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-ink-2">{record.note}</p>
      </section>

      {/* ── Numbers ──────────────────────────────────────────────── */}
      <section className="px-4">
        <Panel>
          <div className="grid grid-cols-3 divide-x divide-line">
            <div className="px-4 py-3.5">
              <Stat label="PEAK SCORE" value={record.peakScore} unit="/100" tone="accent" />
            </div>
            <div className="px-4 py-3.5">
              <Stat label="RADIOS" value={record.devicesSeen} />
            </div>
            <div className="px-4 py-3.5">
              <Stat label="DURATION" value={duration(record.durationSec * 1000) || '—'} />
            </div>
          </div>
        </Panel>
      </section>

      {/* ── Breakdown ────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="CHANNEL BREAKDOWN" hint="How the score was reached" />
          <EvidenceStack breakdown={verdict.breakdown} />
        </Panel>
      </section>

      {/* ── Devices of note ──────────────────────────────────────── */}
      {notable.length > 0 && (
        <section className="mt-3 px-4">
          <div className="px-1 pb-2">
            <Label>DEVICES OF NOTE · {notable.length}</Label>
          </div>
          <div className="space-y-2">
            {notable.map((d) => (
              <DeviceCard key={d.id} device={d} onClick={() => navigate(`/app/devices/${d.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Signals ──────────────────────────────────────────────── */}
      {verdict.reasons.length > 0 && (
        <section className="mt-3 px-4">
          <Panel>
            <PanelHeader title="SIGNALS RAISED" hint={`${verdict.reasons.length} in total`} />
            <ul className="px-4 pb-4">
              {verdict.reasons.map((r, i) => (
                <li key={r.code + i} className="border-b border-line py-2.5 last:border-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-medium text-ink">{r.title}</span>
                    <span className="micro shrink-0">{r.code}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{r.detail}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      )}

      {/* ── Limits ───────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel className="border-dashed">
          <PanelHeader title="WHAT THIS REPORT CANNOT SAY" hint="Read before acting on it" />
          <ul className="space-y-2 px-4 pb-4">
            {[
              'It cannot prove a device was recording, only that it was present and behaving in a particular way.',
              'It cannot see a camera that stores to an SD card and never transmits. Use the lens finder for those.',
              'Bearing is not measurable with one antenna. Distance estimates are indicative only.',
              'A rotating Bluetooth address means a tag cannot be uniquely followed for longer than about fifteen minutes.',
            ].map((t) => (
              <li key={t} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-3">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-4" />
                {t}
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      {/* ── Export ───────────────────────────────────────────────── */}
      <section className="mt-4 space-y-2 px-4">
        <Button full size="lg" variant="accent" icon="download">
          Export signed PDF
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button icon="share">Share bundle</Button>
          <Button icon="flag">Report to venue</Button>
        </div>
        <p className="pt-1 text-center text-[11.5px] leading-relaxed text-ink-4">
          The bundle contains raw sensor logs, the device census, and a SHA-256 of both, so a third
          party can verify nothing was edited after the fact.
        </p>
      </section>
    </div>
  )
}
