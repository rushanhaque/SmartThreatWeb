/* ============================================================================
   LANDING · SYSTEM SECTIONS
   Sensors (pinned horizontal scrub) → Fusion → Hardware.
   ========================================================================== */

import { PG1Glasses } from '@/components/Brand'
import { Icon, type IconName } from '@/components/Icon'
import { Label, Panel, Pill, cx } from '@/components/ui'
import { WEIGHTS } from '@/engine/fusion'
import { gsap, revealChildren, useGsap } from '@/lib/motion'

export function SystemSections() {
  return (
    <>
      <Sensors />
      <Fusion />
      <Hardware />
    </>
  )
}

/* ── Five sensors: pinned horizontal scrub ───────────────────────────────
   The one pinned section in the page. On a phone this converts vertical
   thumb travel into a horizontal reveal, which is a far better fit for five
   sibling items than a stack of five cards you scroll past.               */

const SENSORS: Array<{
  n: string
  title: string
  part: string
  what: string
  why: string
  icon: IconName
  spec: Array<[string, string]>
}> = [
  {
    n: '01',
    title: 'Wi-Fi',
    part: 'ESP32-S3 · promiscuous mode',
    what: 'Counts and fingerprints every access point and station in range, and watches the shape of their traffic.',
    why: 'A camera cannot hide from this. To be useful it has to transmit, and compressed video has a packet cadence nothing else produces.',
    icon: 'wifi',
    spec: [
      ['Channels', '1–13 + 5 GHz'],
      ['Hop interval', '2 s'],
      ['Identifies', 'MAC, OUI, RSSI, rate'],
    ],
  },
  {
    n: '02',
    title: 'Bluetooth',
    part: 'nRF52840 · BLE 5.0',
    what: 'Logs every advertisement and parses the manufacturer data that tags leak on every broadcast.',
    why: 'Apple rotates the FindMy key every fifteen minutes, so identity is useless. Co-motion is not — a tag in your bag holds its distance while you move.',
    icon: 'bluetooth',
    spec: [
      ['Window', 'Continuous'],
      ['Parses', '0x004C · 0x00E0'],
      ['Detects', 'AirTag, Tile, SmartTag, iTAG'],
    ],
  },
  {
    n: '03',
    title: 'RF power',
    part: 'AD8318 log detector',
    what: 'Measures absolute radio energy from 1 MHz to 8 GHz, well outside anything Wi-Fi can see.',
    why: 'Analogue pinhole cameras and audio bugs never touch an IP network. They are invisible to every phone app ever written, and loud to this.',
    icon: 'radio',
    spec: [
      ['Range', '1 MHz – 8 GHz'],
      ['Sample', '100 ms · 50 ms in dark'],
      ['Baseline', '≈ −70 dBm'],
    ],
  },
  {
    n: '04',
    title: 'EM field',
    part: 'Coil + LM358',
    what: 'A hand-wound coil and an op-amp, reading near-field magnetic emission in milligauss.',
    why: 'Powered electronics leak a field whether or not they transmit. Above 3 mG next to a pillow, something is concealed and running.',
    icon: 'bolt',
    spec: [
      ['Background', '< 1.5 mG'],
      ['Threshold', '3 mG sustained'],
      ['Filter', '20-sample average'],
    ],
  },
  {
    n: '05',
    title: 'Ambient light',
    part: 'BH1750 + IR 940 nm',
    what: 'Reads room brightness, and drives the infrared array that makes lenses give themselves away.',
    why: 'Darkness is not a threat — it is a multiplier. It is exactly when IR-capable optics work best, so the scan rate rises to meet it.',
    icon: 'moon',
    spec: [
      ['Range', '1 – 65,535 lux'],
      ['Dark below', '15 lux'],
      ['IR array', '940 nm'],
    ],
  },
]

function Sensors() {
  const scope = useGsap<HTMLElement>((_, el) => {
    const track = el.querySelector<HTMLElement>('[data-track]')
    if (!track) return

    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 32)

    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: () => `+=${distance() + window.innerHeight * 0.6}`,
        pin: true,
        scrub: 0.55,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    })

    // Cards lift slightly as they cross the centre of the viewport.
    gsap.utils.toArray<HTMLElement>('[data-card]').forEach((card) => {
      gsap.fromTo(
        card,
        { y: 22, opacity: 0.45 },
        {
          y: 0,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            containerAnimation: gsap.getTweensOf(track)[0],
            start: 'left 88%',
            end: 'left 45%',
            scrub: true,
          },
        },
      )
    })
  })

  return (
    <section
      id="system"
      ref={scope}
      className="relative flex h-[100svh] flex-col justify-center overflow-hidden border-t border-line"
    >
      <div className="mx-auto w-full max-w-6xl px-5">
        <Label>03 · THE SENSES</Label>
        <h2 className="display-2 mt-4 max-w-[16ch]">Five channels. One verdict.</h2>
        <p className="mt-4 max-w-[46ch] text-[14.5px] leading-relaxed text-ink-2">
          Each one is individually beatable. Together they are hard to fool — which is the whole
          argument for building this as hardware rather than another app.
        </p>
      </div>

      <div className="mt-8 overflow-hidden">
        <div data-track className="flex gap-3 px-5 will-change-transform">
          {SENSORS.map((s) => (
            <article
              data-card
              key={s.n}
              className="panel panel-lit flex w-[80vw] max-w-[380px] shrink-0 flex-col p-5 sm:w-[400px]"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-sm border border-line bg-bg-2 text-ink-2">
                  <Icon name={s.icon} size={20} />
                </div>
                <span className="readout text-[28px] font-semibold leading-none text-ink-4">
                  {s.n}
                </span>
              </div>

              <h3 className="mt-5 text-[22px] font-semibold tracking-[-0.03em]">{s.title}</h3>
              <div className="micro mt-1.5">{s.part.toUpperCase()}</div>

              <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">{s.what}</p>
              <p className="mt-3 border-l border-line-2 pl-3.5 text-[13px] leading-relaxed text-ink-3">
                {s.why}
              </p>

              <dl className="mt-auto space-y-1.5 border-t border-line pt-4">
                {s.spec.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3">
                    <dt className="micro">{k.toUpperCase()}</dt>
                    <dd className="readout text-[12px] text-ink-2">{v}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 w-full max-w-6xl px-5">
        <span className="micro">SCROLL TO ADVANCE →</span>
      </div>
    </section>
  )
}

/* ── Fusion ──────────────────────────────────────────────────────────────── */

const CHANNELS = [
  { key: 'camera' as const, label: 'Camera', example: 'OUI + stream + open 554' },
  { key: 'tracker' as const, label: 'Tracker', example: 'FindMy + co-motion + flat RSSI' },
  { key: 'rf' as const, label: 'RF power', example: 'Peak above the learned floor' },
  { key: 'emf' as const, label: 'EM field', example: 'Sustained above 3 mG' },
  { key: 'dark' as const, label: 'Darkness', example: 'Below 15 lux' },
]

function Fusion() {
  const scope = useGsap<HTMLElement>((_, el) => {
    revealChildren(el, '[data-reveal]', { y: 26, stagger: 0.07 })
    gsap.from('[data-weight]', {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1.1,
      stagger: 0.08,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 68%', once: true },
    })
  })

  return (
    <section ref={scope} className="relative border-t border-line py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Label data-reveal>04 · THE FUSION</Label>
        <h2 data-reveal className="display-2 mt-4 max-w-[19ch]">
          A camera is not a Wi-Fi device. It is five things at once.
        </h2>
        <p data-reveal className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
          This is the core claim of the project. Any single channel produces false positives all
          day — your router is loud, your neighbour owns a doorbell, someone on the train has an
          AirTag. Requiring corroboration across independent physics is what turns noise into a
          finding.
        </p>

        {/* the scoring kernel, stated as it is implemented */}
        <div data-reveal className="mt-10">
          <Panel className="overflow-x-auto p-5">
            <Label>SCORING KERNEL · RUNS ON THE ESP32-S3</Label>
            <code className="readout mt-4 block text-[13px] leading-relaxed whitespace-nowrap text-ink-2">
              <span className="text-ink">score</span> ={' '}
              {CHANNELS.map((c, i) => (
                <span key={c.key}>
                  {i > 0 && ' + '}
                  <span className="text-[var(--color-iris-b)]">{WEIGHTS[c.key].toFixed(2)}</span>
                  <span className="text-ink-4">·</span>
                  {c.key}
                </span>
              ))}
            </code>
          </Panel>
        </div>

        <div className="mt-4 space-y-2">
          {CHANNELS.map((c) => (
            <div
              data-reveal
              key={c.key}
              className="panel flex items-center gap-4 px-4 py-3.5"
            >
              <div className="w-[92px] shrink-0">
                <div className="text-[13.5px] font-medium text-ink">{c.label}</div>
                <div className="readout mt-0.5 text-[11px] text-ink-4">
                  ×{WEIGHTS[c.key].toFixed(2)}
                </div>
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-2">
                <div
                  data-weight
                  className="h-full rounded-full"
                  style={{
                    width: `${(WEIGHTS[c.key] / 0.35) * 100}%`,
                    background:
                      'linear-gradient(90deg, var(--color-iris-a), var(--color-iris-b), var(--color-iris-c))',
                  }}
                />
              </div>
              <div className="hidden w-[190px] shrink-0 text-[12px] text-ink-3 sm:block">
                {c.example}
              </div>
            </div>
          ))}
        </div>

        <div data-reveal className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ['Green · 0–33', 'Baseline. Home, a classroom, your own office.', 't-safe', 'check'],
            ['Yellow · 34–67', 'Unusual but unproven. Worth a deep scan.', 't-caution', 'info'],
            ['Red · 68–100', 'Corroborated. Haptics, buzzer, full detail.', 't-threat', 'alert'],
          ].map(([title, body, tone, icon]) => (
            <Panel key={title} className={cx(tone, 'p-4')}>
              <div className="flex items-center gap-2.5">
                <Icon name={icon as IconName} size={16} className="text-[var(--accent)]" />
                <span className="text-[13.5px] font-semibold text-[var(--accent)]">{title}</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">{body}</p>
            </Panel>
          ))}
        </div>

        <p data-reveal className="mt-8 max-w-[52ch] text-[13px] leading-relaxed text-ink-3">
          A RandomForest of 100 trees, trained on 1,240 labelled windows and converted to C with
          emlearn, refines the class boundary. The rule kernel above supplies the explanation. When
          the two disagree the firmware takes the higher of the pair — a detector should fail loud.
        </p>
      </div>
    </section>
  )
}

/* ── Hardware ────────────────────────────────────────────────────────────── */

function Hardware() {
  const scope = useGsap<HTMLElement>((_, el) => {
    revealChildren(el, '[data-reveal]', { y: 26, stagger: 0.07 })
    gsap.from('.pg-callouts > g', {
      opacity: 0,
      y: 14,
      duration: 0.7,
      stagger: 0.09,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 60%', once: true },
    })
  })

  return (
    <section ref={scope} className="relative border-t border-line py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Label data-reveal>05 · THE HARDWARE</Label>
        <h2 data-reveal className="display-2 mt-4 max-w-[16ch]">
          Everything hides in the temples.
        </h2>
        <p data-reveal className="mt-5 max-w-[50ch] text-[15px] leading-relaxed text-ink-2">
          Two boards, four sensors, a heads-up display and a 1000 mAh cell, packaged into a safety
          frame with a 3D-printed shell. Under 120 g on your face, and it reads as a normal pair of
          glasses across a hotel lobby — which is the point.
        </p>
      </div>

      <div data-reveal className="mt-10 overflow-x-auto px-4 pb-2">
        <PG1Glasses callouts className="mx-auto w-full min-w-[860px] max-w-5xl" />
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['ESP32-S3-WROOM-1', 'N16R8 · dual core', 'Wi-Fi sniffing, BLE central, TinyML inference and the fusion pass.', '₹950'],
            ['XIAO nRF52840', 'BLE 5.0', 'A dedicated radio for tracker work, so BLE never competes with Wi-Fi for airtime.', '₹1,629'],
            ['AD8318 + CC1101', '1 MHz – 8 GHz', 'Logarithmic RF power detection across the bands Wi-Fi cannot reach.', '₹1,400'],
            ['BH1750 + coil', 'Lux + milligauss', 'Ambient light and near-field EM, the two channels that need no packets at all.', '₹580'],
          ].map(([name, spec, body, price]) => (
            <Panel data-reveal key={name} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[14px] font-semibold">{name}</h3>
                <span className="readout shrink-0 text-[12px] text-ink-3">{price}</span>
              </div>
              <div className="micro mt-1.5">{spec.toUpperCase()}</div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">{body}</p>
            </Panel>
          ))}
        </div>

        <div data-reveal className="mt-6 flex flex-wrap gap-2">
          <Pill tone="neutral" icon="battery">
            ~225 mA draw · 3 h practical
          </Pill>
          <Pill tone="neutral" icon="cpu">
            No cloud dependency
          </Pill>
          <Pill tone="neutral" icon="lock">
            No image sensor on the board
          </Pill>
        </div>
      </div>
    </section>
  )
}
