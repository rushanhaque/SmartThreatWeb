/* ============================================================================
   DEVICE DETAIL
   ----------------------------------------------------------------------------
   The dossier on one radio. Structured as an argument: identity, then the
   evidence for and against, then what you can do. The "argue the other side"
   block is not decoration — a detector that never tells you why it might be
   wrong trains people to ignore it.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Divider, Empty, Label, Panel, PanelHeader, Pill, Sheet, Stat, cx } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { Sparkline } from '@/components/viz'
import { actions, selDeviceById, useSelect } from '@/engine/store'
import { rssiVariance } from '@/engine/fusion'
import { ago, duration, proximityLabel, rssiBars, rssiToMetres, throughput } from '@/lib/format'
import { haptic, useNow } from '@/lib/hooks'
import { deviceTone } from './Devices'
import { SignalBars } from '@/components/viz'

const TONE_CLASS = { safe: 't-safe', caution: 't-caution', threat: 't-threat', muted: 't-neutral' } as const

export default function DeviceDetail() {
  const { id = '' } = useParams()
  const selector = useMemo(() => selDeviceById(id), [id])
  const device = useSelect(selector)
  const navigate = useNavigate()
  const now = useNow()
  const [locating, setLocating] = useState(false)

  if (!device) {
    return (
      <Empty
        icon="radio"
        title="Device out of range"
        body="This radio has not been heard from in the last scan window. It may have moved, powered down, or rotated its address."
        action={
          <Button onClick={() => navigate('/app/devices')} icon="arrow-left">
            Back to devices
          </Button>
        }
      />
    )
  }

  const tone = deviceTone(device)
  const variance = rssiVariance(device.rssiTrail)
  const isCamera = device.signals.includes('camera-oui')
  const isTracker = device.signals.includes('findmy') || device.signals.includes('tracker-proto')

  // The headline probability, stated as what it is: a weighted rule score, not
  // a calibrated posterior. Overclaiming here would be the easiest lie to tell.
  const likelihood = useMemo(() => {
    let p = 0
    if (device.signals.includes('camera-oui')) p += 0.42
    if (device.signals.includes('streaming')) p += 0.28
    if (device.signals.includes('rtsp-open')) p += 0.16
    if (device.signals.includes('mdns-camera')) p += 0.1
    if (device.signals.includes('travelling')) p += 0.34
    if (device.signals.includes('findmy')) p += 0.3
    if (variance < 15 && isTracker) p += 0.16
    return Math.min(0.97, p)
  }, [device.signals, variance, isTracker])

  const counterpoints = buildCounterpoints(device, variance)

  return (
    <div className={cx(TONE_CLASS[tone], 'pb-8')}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-2 pt-3">
        <button
          onClick={() => navigate(-1)}
          className="press flex h-10 items-center gap-1.5 rounded-sm px-2.5 text-[13px] text-ink-2"
        >
          <Icon name="arrow-left" size={17} />
          Back
        </button>
      </div>

      {/* ── Identity ─────────────────────────────────────────────── */}
      <section className="px-5 pt-2 pb-5">
        <div className="flex items-start gap-2.5">
          <h1 className="display-3 min-w-0 flex-1">{device.label ?? device.vendor}</h1>
          {tone === 'threat' && <Pill tone="accent" icon="alert">Threat</Pill>}
          {tone === 'caution' && <Pill tone="accent" icon="info">Watch</Pill>}
          {device.trust === 'trusted' && <Pill tone="accent" icon="check">Trusted</Pill>}
        </div>
        <div className="readout mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px]">
          <span className="text-[var(--accent)]">{device.oui}</span>
          <span className="text-ink-3">{device.mac.slice(9)}</span>
          {device.macRandomised && <Pill tone="muted">Randomised</Pill>}
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">
          {describe(device, likelihood)}
        </p>
      </section>

      {/* ── Likelihood ───────────────────────────────────────────── */}
      {(isCamera || isTracker) && (
        <section className="px-4">
          <Panel className="p-4">
            <div className="flex items-end justify-between">
              <div>
                <Label>{isCamera ? 'LIKELY CAMERA' : 'LIKELY TRACKER'}</Label>
                <div className="readout mt-2 text-[38px] font-semibold leading-none text-[var(--accent)]">
                  {Math.round(likelihood * 100)}
                  <span className="ml-0.5 text-[16px]">%</span>
                </div>
              </div>
              <Icon
                name={isCamera ? 'camera' : 'tag'}
                size={34}
                className="text-[var(--accent)] opacity-25"
              />
            </div>
            <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{
                  width: `${likelihood * 100}%`,
                  transition: 'width .8s var(--ease-out-expo)',
                }}
              />
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
              A weighted sum of the rule hits below — not a calibrated probability. It says how
              much evidence stacked up, not how often that evidence is right.
            </p>
          </Panel>
        </section>
      )}

      {/* ── Live telemetry ───────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="LIVE" hint={`Updated ${ago(device.lastSeen, now)}`} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 pb-4">
            <Stat label="SIGNAL" value={device.rssi} unit="dBm" tone="accent" />
            <Stat label="DISTANCE" value={rssiToMetres(device.rssi)} unit="m est." />
            <Stat label="VARIANCE" value={variance.toFixed(1)} unit="dB²" />
            <Stat label="THROUGHPUT" value={throughput(device.throughputKbps)} />
            <Stat label="CHANNEL" value={device.channel ?? '—'} />
            <Stat label="SEEN FOR" value={duration(now - device.firstSeen)} />
          </div>
          <div className="border-t border-line px-4 py-3">
            <div className="flex items-center justify-between">
              <Label>RSSI · LAST 40 SAMPLES</Label>
              <SignalBars bars={rssiBars(device.rssi)} />
            </div>
            <Sparkline
              data={device.rssiTrail}
              width={320}
              height={54}
              strokeWidth={1.6}
              fill
              className="mt-2 w-full"
            />
            <p className="mt-2 text-[12px] text-ink-3">{proximityLabel(device.rssi)}</p>
          </div>
        </Panel>
      </section>

      {/* ── Evidence ─────────────────────────────────────────────── */}
      <section className="mt-3 px-4">
        <Panel>
          <PanelHeader title="EVIDENCE" hint={`${device.signals.length} rule hits`} />
          {device.signals.length === 0 ? (
            <p className="px-4 pb-4 text-[13px] leading-relaxed text-ink-3">
              No rule fired for this device. It is an ordinary radio as far as every channel is
              concerned.
            </p>
          ) : (
            <ul className="px-4 pb-4 space-y-2.5">
              {device.signals.map((s) => (
                <li key={s} className="flex gap-2.5">
                  <Icon
                    name="check"
                    size={14}
                    className="mt-1 shrink-0 text-[var(--accent)]"
                  />
                  <div>
                    <div className="text-[13px] font-medium text-ink">{SIGNAL_TITLE[s]}</div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-ink-3">
                      {SIGNAL_BODY[s]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {device.openPorts.length > 0 && (
            <>
              <Divider />
              <div className="px-4 py-3.5">
                <Label>OPEN PORTS</Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {device.openPorts.map((p) => (
                    <span
                      key={p}
                      className="readout rounded-xs border border-line bg-bg-2 px-2 py-1 text-[11.5px] text-ink-2"
                    >
                      {p}
                      <span className="ml-1.5 text-ink-4">{PORT_NAME[p] ?? 'tcp'}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-4">
                  Port checks run from your phone, never the glasses, and only on networks you
                  have joined. Passive mode disables them entirely.
                </p>
              </div>
            </>
          )}
        </Panel>
      </section>

      {/* ── The other side of the argument ───────────────────────── */}
      {counterpoints.length > 0 && (
        <section className="mt-3 px-4">
          <Panel className="border-dashed">
            <PanelHeader title="ARGUING THE OTHER SIDE" hint="Why this could be innocent" />
            <ul className="space-y-2 px-4 pb-4">
              {counterpoints.map((c) => (
                <li key={c} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-3">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-4" />
                  {c}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      )}

      {/* ── Actions ──────────────────────────────────────────────── */}
      <section className="mt-4 space-y-2 px-4">
        <Button
          full
          size="lg"
          variant="accent"
          icon="target"
          onClick={() => {
            haptic('tap')
            setLocating(true)
          }}
        >
          Walk it down
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {device.trust === 'trusted' ? (
            <Button icon="eye" onClick={() => actions.setTrust(device.id, 'unknown')}>
              Untrust
            </Button>
          ) : (
            <Button icon="check" onClick={() => actions.setTrust(device.id, 'trusted')}>
              Trust
            </Button>
          )}
          <Button icon="flag" onClick={() => actions.setTrust(device.id, 'flagged')}>
            Flag
          </Button>
        </div>
        <Button full variant="ghost" icon="share">
          Export evidence bundle
        </Button>
      </section>

      <LocateSheet open={locating} onClose={() => setLocating(false)} rssi={device.rssi} name={device.label ?? device.vendor} />
    </div>
  )
}

/* ── Walk-it-down sheet ──────────────────────────────────────────────────
   A single enormous number and a hot/cold bar. When you are on your knees
   behind a hotel headboard, this is the only screen that matters.        */

function LocateSheet({
  open,
  onClose,
  rssi,
  name,
}: {
  open: boolean
  onClose: () => void
  rssi: number
  name: string
}) {
  const t = Math.min(1, Math.max(0, (rssi + 92) / 60))
  return (
    <Sheet open={open} onClose={onClose} title="Walk it down">
      <div className="px-5 pt-6 pb-8 text-center">
        <Label>{name.toUpperCase()}</Label>
        <div className="readout mt-4 text-[76px] font-semibold leading-none tracking-[-0.05em] text-[var(--accent)]">
          {rssi}
        </div>
        <div className="micro mt-1">dBm · higher is closer</div>

        <div className="relative mt-7 h-2.5 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${t * 100}%`, transition: 'width .45s var(--ease-out-quart)' }}
          />
        </div>
        <div className="mt-2 flex justify-between">
          <span className="micro">COLD −92</span>
          <span className="micro">HOT −32</span>
        </div>

        <p className="mx-auto mt-6 max-w-[34ch] text-[13px] leading-relaxed text-ink-2">
          Move slowly and sweep the room in a grid. The number climbs as you close in. Check the
          things that face the bed first: smoke detectors, alarm clocks, air purifiers, USB
          chargers, and the seam of any mirror.
        </p>
      </div>
    </Sheet>
  )
}

/* ── Copy tables ─────────────────────────────────────────────────────────── */

const SIGNAL_TITLE: Record<string, string> = {
  'camera-oui': 'Camera-vendor OUI',
  streaming: 'Sustained video-shaped traffic',
  'rtsp-open': 'RTSP port answering',
  'mdns-camera': 'Advertises a camera service',
  findmy: 'Apple FindMy advertisement',
  'tracker-proto': 'Tracker protocol match',
  travelling: 'Moving with you',
  'low-variance': 'Constant distance',
  'hidden-ssid': 'Hidden network name',
  'new-tonight': 'First seen this session',
}

const SIGNAL_BODY: Record<string, string> = {
  'camera-oui': 'The first three octets belong to a block registered to a surveillance manufacturer.',
  streaming: 'Packet-length variance matches an H.264 keyframe cadence held for over twenty seconds.',
  'rtsp-open': 'A socket connect to 554 or 8000 was accepted. That is a streaming endpoint.',
  'mdns-camera': 'The device published a _camera or _rtsp record over multicast DNS.',
  findmy: 'Manufacturer data 0x004C with a status byte in the offline-finding range.',
  'tracker-proto': 'The service UUID matches a commercial item-tracker protocol.',
  travelling: 'Continuously in range across more than 30 m of your own movement.',
  'low-variance': 'Signal strength barely moves while you do — it is travelling with you, not fixed in a room.',
  'hidden-ssid': 'Beacons with a suppressed SSID. Common on cameras that do not want to be browsed.',
  'new-tonight': 'Not present in the baseline for this location.',
}

const PORT_NAME: Record<number, string> = {
  22: 'ssh',
  53: 'dns',
  80: 'http',
  443: 'https',
  554: 'rtsp',
  8000: 'rtsp-alt',
  8009: 'cast',
}

function describe(d: ReturnType<typeof Object> extends never ? never : any, likelihood: number): string {
  if (d.trust === 'trusted') {
    return 'You added this to your trusted list, so it is excluded from scoring. Untrust it to bring it back into the fusion engine.'
  }
  if (d.signals.includes('camera-oui') && d.signals.includes('streaming')) {
    return 'This is the full camera signature: a surveillance-vendor address, a stream shaped like compressed video, and a listening RTSP port. Treat it as a live camera until proven otherwise.'
  }
  if (d.signals.includes('travelling')) {
    return 'This tag has stayed within range through your own movement, at a distance that barely changes. That pattern is a tag in your bag or on your vehicle, not one sitting in a room you walked past.'
  }
  if (d.signals.includes('camera-oui')) {
    return 'The address belongs to a camera manufacturer, but nothing is streaming. It may be idle, recording locally, or a doorbell on the other side of a wall.'
  }
  if (d.kind === 'rf-emitter') {
    return 'A carrier with no packet identity at all. Nothing here to fingerprint — only RF power and EM field can see it, which is exactly why those channels exist.'
  }
  return 'An ordinary radio. No rule has fired against it; it is listed for completeness so the census is honest about what is in the room.'
}

function buildCounterpoints(d: any, variance: number): string[] {
  const out: string[] = []
  if (d.signals.includes('camera-oui') && !d.signals.includes('streaming')) {
    out.push('Camera OUIs also appear on doorbells, baby monitors and NVR boxes belonging to a neighbour.')
  }
  if (d.signals.includes('streaming') && !d.signals.includes('camera-oui')) {
    out.push('A phone mirroring to a TV produces a very similar throughput profile.')
  }
  if (d.signals.includes('findmy') && !d.signals.includes('travelling')) {
    out.push('FindMy tags are everywhere. Without co-motion this is almost certainly someone else’s keys.')
  }
  if (variance > 40) {
    out.push('High RSSI variance suggests it is fixed in the room while you move — the opposite of a tag on your person.')
  }
  if (d.kind === 'rf-emitter') {
    out.push('Microwave ovens, cordless phones and car key fobs all put strong energy into these bands.')
  }
  if (d.rssi < -80) {
    out.push('At this signal strength it is likely behind a wall, and may not be in your space at all.')
  }
  return out
}
