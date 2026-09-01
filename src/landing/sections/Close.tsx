/* ============================================================================
   LANDING · CLOSING SECTIONS
   App tour → BOM → 24-week plan → limits → footer.
   ========================================================================== */

import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/Icon'
import { Logomark } from '@/components/Brand'
import { Button, Label, Panel, Pill, cx } from '@/components/ui'
import { gsap, revealChildren, useGsap } from '@/lib/motion'

export function CloseSections() {
  return (
    <>
      <AppTour />
      <Budget />
      <Plan />
      <Limits />
      <Footer />
    </>
  )
}

/* ── App tour ────────────────────────────────────────────────────────────── */

const SCREENS: Array<{ title: string; body: string; icon: IconName; to: string }> = [
  {
    title: 'Shield',
    body: 'One number, one colour, and the reasoning behind both. The screen a notification opens to.',
    icon: 'shield',
    to: '/app',
  },
  {
    title: 'Devices',
    body: 'Every radio in range, ranked by risk rather than signal strength, with the evidence attached.',
    icon: 'radio',
    to: '/app/devices',
  },
  {
    title: 'Deep scan',
    body: 'A ninety-second sweep with findings streaming as they are produced, ending in a saved report.',
    icon: 'scan',
    to: '/app/scan',
  },
  {
    title: 'Tracker watch',
    body: 'The anti-stalking flow. Written for someone reading it while frightened.',
    icon: 'tag',
    to: '/app/tracker',
  },
  {
    title: 'Lens finder',
    body: 'Infrared retro-reflection, for the cameras that record to a card and never transmit.',
    icon: 'eye',
    to: '/app/lens',
  },
  {
    title: 'Signals',
    body: 'RF, EM field and light against the learned baseline for the room you are standing in.',
    icon: 'waves',
    to: '/app/signals',
  },
]

function AppTour() {
  const scope = useGsap<HTMLElement>((_, el) => {
    revealChildren(el, '[data-reveal]', { y: 26, stagger: 0.06 })
  })

  return (
    <section ref={scope} className="relative border-t border-line py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Label data-reveal>06 · THE COMPANION</Label>
        <h2 data-reveal className="display-2 mt-4 max-w-[17ch]">
          The glasses decide. The app explains.
        </h2>
        <p data-reveal className="mt-5 max-w-[50ch] text-[15px] leading-relaxed text-ink-2">
          A heads-up display can show you a colour. It cannot show you a MAC address, a traffic
          profile, or four minutes of RSSI history — so everything that needs to be read rather
          than glanced at lives here.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SCREENS.map((s) => (
            <Link data-reveal key={s.title} to={s.to} className="group">
              <Panel className="press h-full p-5 transition-colors duration-300 group-hover:border-line-2">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-sm border border-line bg-bg-2 text-ink-2">
                    <Icon name={s.icon} size={18} />
                  </div>
                  <Icon
                    name="arrow-up-right"
                    size={15}
                    className="text-ink-4 transition-colors group-hover:text-ink-2"
                  />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{s.body}</p>
              </Panel>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Budget ──────────────────────────────────────────────────────────────── */

const BOM = [
  ['ESP32-S3-DevKitC-1 N16R8', 1, 950],
  ['XIAO nRF52840', 1, 1629],
  ['CC1101 + AD8318 RF module', 1, 1400],
  ['BH1750 ambient light sensor', 1, 230],
  ['Copper coil + LM358 (EMF)', 1, 350],
  ['0.96" OLED SSD1306', 1, 350],
  ['IR LED array 940 nm + filter', 1, 320],
  ['LiPo 1000 mAh + TP4056 Type-C', 1, 600],
  ['Vibration motor + buzzer + RGB LED', 1, 250],
  ['Safety frame + 3D print', 1, 1200],
  ['JLCPCB · 5 pcs', 1, 2000],
  ['Breadboard, wires, passives', 1, 1000],
  ['ESP32-CAM test units', 2, 600],
  ['iTAG test tracker', 1, 800],
] as const

function Budget() {
  const scope = useGsap<HTMLElement>((_, el) => {
    revealChildren(el, '[data-reveal]', { y: 24, stagger: 0.05 })
  })

  const subtotal = BOM.reduce((a, [, qty, price]) => a + qty * price, 0)
  const contingency = 1850

  return (
    <section ref={scope} className="relative border-t border-line py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Label data-reveal>07 · THE BUDGET</Label>
        <h2 data-reveal className="display-2 mt-4 max-w-[16ch]">
          Under ₹14,000. Split four ways.
        </h2>
        <p data-reveal className="mt-5 max-w-[50ch] text-[15px] leading-relaxed text-ink-2">
          Every part is available from Robu, Amazon India, or off the shelf in Lajpat Nagar. That
          constraint is a feature: another team can reproduce this build from the same list.
        </p>

        <div data-reveal className="mt-10">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <Label>MVP BILL OF MATERIALS</Label>
              <Label>INR</Label>
            </div>
            <ul>
              {BOM.map(([name, qty, price]) => (
                <li
                  key={name}
                  className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0"
                >
                  <span className="flex-1 text-[13px] text-ink-2">{name}</span>
                  {qty > 1 && <span className="readout text-[11.5px] text-ink-4">×{qty}</span>}
                  <span className="readout w-[68px] text-right text-[12.5px] text-ink">
                    {(qty * price).toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-line bg-bg-2 px-4 py-3.5">
              <Cost label="Subtotal" value={subtotal} />
              <Cost label="Contingency + shipping" value={contingency} />
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-[14px] font-semibold text-ink">Total</span>
                <span className="readout text-[22px] font-semibold text-ink">
                  ₹{(subtotal + contingency).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[12.5px] text-ink-3">Per student, team of four</span>
                <span className="readout text-[13px] text-ink-2">
                  ₹{Math.round((subtotal + contingency) / 4).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  )
}

function Cost({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[12.5px] text-ink-3">{label}</span>
      <span className="readout text-[13px] text-ink-2">₹{value.toLocaleString('en-IN')}</span>
    </div>
  )
}

/* ── 24-week plan ────────────────────────────────────────────────────────── */

const PHASES = [
  ['Phase 0', 'Weeks 1–2', 'Ideation', 'Concept locked, guide approval, parts ordered, papers read.', 'Synopsis + BOM'],
  ['Phase 1', 'Weeks 3–6', 'Breadboard MVP', 'Wi-Fi and BLE scanning against a planted ESP32-CAM; OLED status out.', 'Serial logs showing detection'],
  ['Phase 2', 'Weeks 7–10', 'RF + EMF', 'AD8318 integrated and calibrated; coil sensor wound and filtered.', 'RF + EMF demo video'],
  ['Phase 3', 'Weeks 11–14', 'AI fusion', '100 labelled environments collected, RandomForest trained, converted to C.', 'Model running on-device'],
  ['Phase 4', 'Weeks 15–18', 'Wearable build', 'Fusion360 enclosure, EasyEDA PCB, assembly onto the frame, power testing.', 'Prototype v1 wearable'],
  ['Phase 5', 'Weeks 19–21', 'App + integration', 'BLE transport, device list, threat history, end-to-end verification.', 'App build + alert video'],
  ['Phase 6', 'Weeks 22–24', 'Polish + report', 'Field testing, viva preparation, final report, paper draft, poster.', 'Submission ready'],
] as const

function Plan() {
  const scope = useGsap<HTMLElement>((_, el) => {
    revealChildren(el, '[data-reveal]', { y: 24, stagger: 0.06 })
    const line = el.querySelector<SVGLineElement>('[data-spine]')
    if (line) {
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: 'top center',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 70%', end: 'bottom 80%', scrub: 0.6 },
        },
      )
    }
  })

  return (
    <section ref={scope} className="relative border-t border-line py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Label data-reveal>08 · THE PLAN</Label>
        <h2 data-reveal className="display-2 mt-4 max-w-[14ch]">
          Twenty-four weeks.
        </h2>

        <div className="relative mt-10 pl-8">
          <svg className="absolute top-2 left-[11px] h-[calc(100%-2rem)] w-px overflow-visible">
            <line
              data-spine
              x1="0.5"
              y1="0"
              x2="0.5"
              y2="100%"
              stroke="var(--color-iris-b)"
              strokeWidth="1.5"
              opacity="0.55"
            />
          </svg>
          <div className="absolute top-2 left-0 h-full w-px bg-line" />

          <ol className="space-y-3">
            {PHASES.map(([phase, weeks, title, body, deliverable]) => (
              <li data-reveal key={phase} className="relative">
                <span className="absolute top-5 -left-8 h-2 w-2 -translate-x-1/2 rounded-full bg-ink-3 ring-4 ring-bg" />
                <Panel className="p-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="micro">{phase.toUpperCase()}</span>
                    <span className="readout text-[11.5px] text-ink-4">{weeks}</span>
                  </div>
                  <h3 className="mt-2 text-[16px] font-semibold">{title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{body}</p>
                  <div className="mt-3 border-t border-line pt-3">
                    <Pill tone="muted" icon="flag">
                      {deliverable}
                    </Pill>
                  </div>
                </Panel>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ── Limits ──────────────────────────────────────────────────────────────
   Stated on the marketing page, not buried in a disclaimer. A privacy tool
   that oversells itself is worse than none, because it produces confident
   people in rooms that were never actually cleared.                       */

const LIMITS = [
  ['SD-card cameras', 'A camera that records locally and never transmits is invisible to every radio channel. The infrared lens finder exists for exactly this case, and it needs a human to look.'],
  ['Rotating addresses', 'Apple re-keys FindMy every fifteen minutes. Tags can be followed across that window by physics, not identity, and no longer.'],
  ['No bearing', 'One antenna gives distance, not direction. The app says "≈ 3 m", never "behind you" — the field plot is deliberately unlabelled on angle.'],
  ['Dense RF', 'An airport concourse is loud. Sensitivity is a user-facing control because no single threshold is right in both a hotel room and a departure gate.'],
  ['Prototype accuracy', 'Trained on 1,240 windows from ten locations. Enough to demonstrate the method; not enough to claim a certified detection rate.'],
]

function Limits() {
  const scope = useGsap<HTMLElement>((_, el) => {
    revealChildren(el, '[data-reveal]', { y: 24, stagger: 0.06 })
  })

  return (
    <section ref={scope} className="relative border-t border-line py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Label data-reveal>09 · THE LIMITS</Label>
        <h2 data-reveal className="display-2 mt-4 max-w-[18ch]">
          What it cannot do.
        </h2>
        <p data-reveal className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
          Stated here rather than in a footnote. A detector that oversells itself produces
          confident people standing in rooms that were never actually cleared, which is a worse
          outcome than owning no detector at all.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {LIMITS.map(([title, body]) => (
            <Panel data-reveal key={title} className="border-dashed p-5">
              <h3 className="text-[15px] font-semibold">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{body}</p>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Footer ──────────────────────────────────────────────────────────────── */

function Footer() {
  const scope = useGsap<HTMLElement>((_, el) => {
    revealChildren(el, '[data-reveal]', { y: 28, stagger: 0.08 })
  })

  return (
    <footer ref={scope} className="relative overflow-hidden border-t border-line">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(90% 70% at 50% 100%, rgba(12,107,117,0.10), transparent 65%)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 py-24 text-center">
        <div data-reveal className="flex justify-center">
          <Logomark size={40} active />
        </div>
        <h2 data-reveal className="display-2 mx-auto mt-7 max-w-[16ch]">
          Walk in already knowing.
        </h2>
        <p data-reveal className="mx-auto mt-5 max-w-[42ch] text-[15px] leading-relaxed text-ink-2">
          The companion app runs on simulated telemetry until the PG-1 firmware lands. Every
          screen, every number and every state is the real thing.
        </p>
        <div data-reveal className="mt-8 flex flex-wrap justify-center gap-2.5">
          <Link to="/app">
            <Button size="lg" variant="primary" iconAfter="arrow-up-right">
              Open the app
            </Button>
          </Link>
          <Link to="/onboarding">
            <Button size="lg" variant="quiet" icon="play">
              Replay first run
            </Button>
          </Link>
        </div>

        <div
          data-reveal
          className="mt-14 flex flex-col items-center gap-3 border-t border-line pt-8 text-[12px] text-ink-3 sm:flex-row sm:justify-between"
        >
          <span>PrivacyGlass PG-1 · Final-year project · Academic prototype</span>
          <span className="readout">Chandausi, UP · 2026</span>
        </div>
      </div>
    </footer>
  )
}
