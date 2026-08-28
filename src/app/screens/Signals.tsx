/* ============================================================================
   SIGNALS — the analogue channels
   ----------------------------------------------------------------------------
   Wi-Fi and BLE give you names. RF and EMF give you nothing but a number, and
   that number is meaningless without its baseline — so every trace on this
   screen is drawn against the learned floor for this place, not an absolute
   scale. "−38 dBm" means nothing. "−38 dBm where this room normally sits at
   −71" means someone is transmitting next to you.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { Gauge, Spectrum, Trace } from '@/components/viz'
import { Label, Panel, PanelHeader, Pill, Segmented, Stat, cx } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { selFrames, selPlace, selVerdict, useSelect } from '@/engine/store'
import { clockTime } from '@/lib/format'

type Range = '30s' | '2m'

export default function Signals() {
  const frames = useSelect(selFrames)
  const verdict = useSelect(selVerdict)
  const place = useSelect(selPlace)
  const [range, setRange] = useState<Range>('30s')

  const view = useMemo(
    () => (range === '30s' ? frames.slice(-60) : frames),
    [frames, range],
  )
  const last = frames[frames.length - 1]

  const stats = useMemo(() => {
    const rf = view.map((f) => f.rfDbm)
    const baseline = frames.slice(0, 60).reduce((a, f) => a + f.rfDbm, 0) / Math.max(1, Math.min(60, frames.length))
    return {
      peak: Math.max(...rf),
      mean: rf.reduce((a, b) => a + b, 0) / rf.length,
      baseline,
      delta: Math.max(...rf) - baseline,
    }
  }, [view, frames])

  // Band occupancy is modelled from the current RF level: a real build reads
  // this from the CC1101 sweeping its synthesiser across each band.
  const bands = useMemo(() => {
    const norm = Math.min(1, Math.max(0, (last.rfDbm + 80) / 50))
    const shape = [0.22, 0.14, 0.1, 0.95, 0.42, 0.18]
    return shape.map((s, i) => Math.min(1, s * (0.55 + norm * 0.75) + (i === 3 ? norm * 0.2 : 0)))
  }, [last.rfDbm])

  const peakBand = bands.indexOf(Math.max(...bands))

  return (
    <div className="pb-6">
      <div className="flex items-end justify-between gap-4 px-5 pt-6 pb-4">
        <div className="min-w-0">
          <h1 className="display-3">Signals</h1>
          <p className="mt-1.5 truncate text-[13px] text-ink-3">
            Baseline learned for {place}
          </p>
        </div>
        <Segmented
          className="w-[108px] shrink-0"
          value={range}
          onChange={setRange}
          options={[
            { value: '30s', label: '30 s' },
            { value: '2m', label: '2 m' },
          ]}
        />
      </div>

      {/* ── RF power ─────────────────────────────────────────────── */}
      <section className="px-4">
        <Panel>
          <PanelHeader
            title="RF POWER · AD8318"
            hint="1 MHz – 8 GHz log detector"
            action={
              stats.delta > 20 ? (
                <Pill tone="accent" icon="alert">
                  +{stats.delta.toFixed(0)} dB
                </Pill>
              ) : (
                <Pill tone="muted">Nominal</Pill>
              )
            }
          />
          <div className="px-4 pb-2">
            <Trace
              frames={view}
              channel="rfDbm"
              unit="dBm"
              domain={[-90, -20]}
              threshold={-45}
              height={120}
            />
          </div>
          <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
            <div className="px-4 py-3">
              <Stat label="PEAK" value={stats.peak.toFixed(0)} unit="dBm" tone="accent" />
            </div>
            <div className="px-4 py-3">
              <Stat label="MEAN" value={stats.mean.toFixed(0)} unit="dBm" />
            </div>
            <div className="px-4 py-3">
              <Stat label="BASELINE" value={stats.baseline.toFixed(0)} unit="dBm" />
            </div>
          </div>
        </Panel>
      </section>

      {/* ── Spectrum ─────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader
            title="BAND OCCUPANCY"
            hint="Where the energy actually is"
            action={<Label>PEAK {['433M', '868M', '1.2G', '2.4G', '5.2G', '5.8G'][peakBand]}</Label>}
          />
          <Spectrum levels={bands} peakBand={peakBand} />
          <p className="px-4 pb-4 text-[12px] leading-relaxed text-ink-3">
            2.4 GHz is always busy — that is Wi-Fi and Bluetooth doing their job. The bands worth
            watching are 1.2 and 5.8 GHz, where analogue pinhole cameras live and nothing else
            legitimate usually does.
          </p>
        </Panel>
      </section>

      {/* ── EMF + light ──────────────────────────────────────────── */}
      <section className="mt-3 grid grid-cols-2 gap-3 px-4">
        <Panel className="pt-3.5 pb-4">
          <div className="px-4">
            <Label>EM FIELD</Label>
          </div>
          <div className="mt-3">
            <Gauge value={last.emfMg} max={10} danger={3} label="COIL + LM358" unit="mG" />
          </div>
          <p className="mt-2 px-4 text-center text-[11.5px] leading-snug text-ink-3">
            Background sits under 1.5 mG
          </p>
        </Panel>

        <Panel className="pt-3.5 pb-4">
          <div className="px-4">
            <Label>AMBIENT LIGHT</Label>
          </div>
          <div className="mt-3">
            <Gauge value={Math.min(500, last.lux)} max={500} danger={15} label="BH1750" unit="lx" />
          </div>
          <p className="mt-2 px-4 text-center text-[11.5px] leading-snug text-ink-3">
            {last.lux < 15 ? 'Dark — scan rate raised' : 'Lit — normal cadence'}
          </p>
        </Panel>
      </section>

      {/* ── EMF trace ────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="EM FIELD · 40 SAMPLES" hint="Averaged over 20 reads, low-pass filtered" />
          <div className="px-4 pb-4">
            <Trace frames={view} channel="emfMg" unit="mG" domain={[0, 10]} threshold={3} height={92} />
          </div>
        </Panel>
      </section>

      {/* ── Cadence explainer ────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="SCAN CADENCE" hint="What the glasses are doing right now" />
          <ul className="space-y-0 px-4 pb-4">
            {[
              ['Wi-Fi channel hop', '2 s', 'wifi'],
              ['BLE advertisement window', 'Continuous', 'bluetooth'],
              ['RF ADC read', last.lux < 15 ? '50 ms · boosted' : '100 ms', 'radio'],
              ['EMF + lux sample', '500 ms', 'bolt'],
              ['Fusion pass', '5 s', 'aperture'],
            ].map(([label, cadence, icon]) => (
              <li
                key={label}
                className="flex items-center gap-3 border-b border-line py-2.5 last:border-0"
              >
                <Icon name={icon as never} size={15} className="shrink-0 text-ink-4" />
                <span className="flex-1 text-[13px] text-ink-2">{label}</span>
                <span
                  className={cx(
                    'readout text-[12px]',
                    cadence.includes('boosted') ? 'text-[var(--accent)]' : 'text-ink-3',
                  )}
                >
                  {cadence}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <p className="mt-5 px-6 text-center text-[11.5px] text-ink-3">
        Last fusion pass at {clockTime(verdict.at)} · score {verdict.score}
      </p>
    </div>
  )
}
