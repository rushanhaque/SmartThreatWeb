/* ============================================================================
   TRACKER WATCH — the anti-stalking flow
   ----------------------------------------------------------------------------
   The one screen in this app that someone might open while frightened. Design
   rules that follow from that, and that override the house style where they
   conflict:

     · One decision per screenful. No dense readouts competing for attention.
     · Say what is happening in a sentence a stressed person can parse.
     · Put the safe, reversible action ("this is mine") in easy reach so the
       common case is one tap, and never make dismissal feel like a failure.
     · Real helplines, stated plainly, above the technical detail.
   ========================================================================== */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Label, Panel, PanelHeader, Pill, Stat } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { Sparkline } from '@/components/viz'
import { actions, selDevices, useSelect } from '@/engine/store'
import { rssiVariance } from '@/engine/fusion'
import { duration } from '@/lib/format'
import { useNow, useScrollLock } from '@/lib/hooks'

/* A stylised route: five stops where the tag was re-heard. Real builds fill
   this from the phone's coarse location feed, which is why the glasses never
   need GPS of their own. */
const STOPS = [
  { x: 12, y: 78, label: 'Cafe' },
  { x: 34, y: 60, label: 'Metro' },
  { x: 54, y: 66, label: 'Interchange' },
  { x: 74, y: 40, label: 'Market' },
  { x: 90, y: 22, label: 'Here' },
]

export default function TrackerWatch() {
  const devices = useSelect(selDevices)
  const navigate = useNavigate()
  const now = useNow()
  useScrollLock(false)

  const tag = useMemo(
    () =>
      devices.find((d) => d.signals.includes('travelling')) ??
      devices.find((d) => d.signals.includes('findmy') || d.signals.includes('tracker-proto')) ??
      null,
    [devices],
  )

  if (!tag) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-bg px-8 text-center t-safe">
        <div className="grid h-14 w-14 place-items-center rounded-full border border-line bg-surface-2 text-safe">
          <Icon name="check" size={24} />
        </div>
        <div>
          <h1 className="display-3">Nothing is following you</h1>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">
            No tracker has stayed in range across your movement. The glasses keep watching in the
            background — you do not need to check this screen.
          </p>
        </div>
        <Button icon="arrow-left" onClick={() => navigate('/app')}>
          Back to shield
        </Button>
      </div>
    )
  }

  const dwell = now - tag.firstSeen
  const variance = rssiVariance(tag.rssiTrail)
  const path = STOPS.map((s, i) => `${i ? 'L' : 'M'}${s.x} ${s.y}`).join(' ')

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg t-threat">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[40vh]"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)',
        }}
      />

      <div
        className="relative flex h-14 shrink-0 items-center justify-between px-4"
        style={{ paddingTop: 'var(--spacing-safe-t)' }}
      >
        <Label>TRACKER WATCH</Label>
        <button
          onClick={() => navigate('/app')}
          aria-label="Close"
          className="press grid h-10 w-10 place-items-center rounded-sm text-ink-2"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      {/* ── The statement ────────────────────────────────────────── */}
      <section className="relative px-5 pt-4 pb-6">
        <Pill tone="accent" icon="alert">
          Travelling with you
        </Pill>
        <h1 className="display-2 mt-4">
          A {tag.vendor.replace('Apple ', '')} has been with you for{' '}
          <span className="text-[var(--accent)]">{Math.round(dwell / 60000)} minutes</span>.
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
          It has stayed in range across four separate stops while its distance from you barely
          changed. That is the signature of a tag in your bag, coat or vehicle — not one sitting in
          a place you walked past.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-3">
          Apple’s own alert for this would typically arrive several hours from now.
        </p>
      </section>

      {/* ── Primary action ───────────────────────────────────────── */}
      <section className="relative space-y-2 px-4">
        <Button
          full
          size="lg"
          icon="check"
          onClick={() => {
            actions.setTrust(tag.id, 'trusted')
            navigate('/app')
          }}
        >
          This one is mine
        </Button>
        <p className="px-1 text-center text-[11.5px] text-ink-4">
          Adds it to your trusted list. You can undo this from the device page at any time.
        </p>
      </section>

      {/* ── Journey ──────────────────────────────────────────────── */}
      <section className="relative mt-6 px-4">
        <Panel>
          <PanelHeader title="WHERE IT STAYED WITH YOU" hint="Five re-acquisitions across your route" />
          <div className="px-4 pb-4">
            <svg viewBox="0 0 100 90" className="w-full" style={{ height: 160 }}>
              <defs>
                <linearGradient id="tw-path" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
                </linearGradient>
              </defs>
              <g stroke="var(--color-line)" strokeWidth="0.3">
                {[20, 40, 60, 80].map((y) => (
                  <line key={y} x1="0" y1={y} x2="100" y2={y} />
                ))}
              </g>
              <path
                d={path}
                fill="none"
                stroke="url(#tw-path)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="200"
                strokeDashoffset="200"
                style={{ animation: 'tw-draw 2.2s var(--ease-out-expo) forwards' }}
              />
              {STOPS.map((s, i) => (
                <g key={s.label}>
                  <circle cx={s.x} cy={s.y} r={i === STOPS.length - 1 ? 3 : 2} fill="var(--accent)" />
                  {i === STOPS.length - 1 && (
                    <circle cx={s.x} cy={s.y} r="3" fill="none" stroke="var(--accent)" strokeWidth="0.6">
                      <animate attributeName="r" values="3;9;3" dur="2.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.9;0;0.9" dur="2.2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text
                    x={s.x}
                    y={s.y - 5}
                    fontSize="3.2"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fill="var(--color-ink-3)"
                  >
                    {s.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
            <div className="px-4 py-3">
              <Stat label="DWELL" value={duration(dwell)} tone="accent" />
            </div>
            <div className="px-4 py-3">
              <Stat label="VARIANCE" value={variance.toFixed(1)} unit="dB²" />
            </div>
            <div className="px-4 py-3">
              <Stat label="SIGNAL" value={tag.rssi} unit="dBm" />
            </div>
          </div>

          <div className="border-t border-line px-4 py-3">
            <Label>DISTANCE FROM YOU · 40 SAMPLES</Label>
            <Sparkline data={tag.rssiTrail} width={320} height={44} fill className="mt-2 w-full" />
            <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
              A flat line here is the finding. Something in the room would rise and fall as you
              moved around it.
            </p>
          </div>
        </Panel>
      </section>

      {/* ── If it is not yours ───────────────────────────────────── */}
      <section className="relative mt-3 px-4">
        <Panel>
          <PanelHeader title="IF IT IS NOT YOURS" hint="In order" />
          <ol className="px-4 pb-4">
            {[
              ['Get somewhere public and lit', 'Do not go home while it is still with you.'],
              ['Search your belongings', 'Bag linings, coat pockets, the wheel arches and boot of a vehicle.'],
              ['Do not destroy it', 'It is evidence. Photograph it in place before you touch it.'],
              ['Report it', 'Police can serve the manufacturer for the account behind the tag.'],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-3 border-b border-line py-3 last:border-0">
                <span className="readout mt-0.5 shrink-0 text-[12px] text-[var(--accent)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="text-[13.5px] font-medium text-ink">{title}</div>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-3">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </section>

      {/* ── Helplines ────────────────────────────────────────────── */}
      <section className="relative mt-3 px-4">
        <Panel>
          <PanelHeader title="HELP · INDIA" hint="Free, 24 hours" />
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            {[
              ['112', 'Emergency'],
              ['1091', 'Women’s helpline'],
              ['1930', 'Cyber crime'],
              ['181', 'Women in distress'],
            ].map(([num, label]) => (
              <a
                key={num}
                href={`tel:${num}`}
                className="press flex items-center justify-between rounded-sm border border-line bg-bg-2 px-3.5 py-3"
              >
                <div>
                  <div className="readout text-[17px] font-semibold text-ink">{num}</div>
                  <div className="micro mt-1">{label.toUpperCase()}</div>
                </div>
                <Icon name="arrow-up-right" size={15} className="text-ink-4" />
              </a>
            ))}
          </div>
        </Panel>
      </section>

      <div
        className="relative mt-4 px-4"
        style={{ paddingBottom: 'calc(2rem + var(--spacing-safe-b))' }}
      >
        <Button full variant="ghost" icon="share">
          Export evidence bundle for police
        </Button>
      </div>

      <style>{`@keyframes tw-draw { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  )
}
