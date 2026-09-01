/* ============================================================================
   LANDING — the case for the project
   ----------------------------------------------------------------------------
   Built mobile-first and scroll-driven. The motion is narrative, not
   decorative: the glasses power on as you arrive, the statistics count up as
   you reach them, the five sensors scrub past horizontally under your thumb,
   and the hardware assembles itself callout by callout.

   Performance discipline throughout — transform and opacity only, one pinned
   section, every trigger reverted on unmount, and the whole thing inert under
   `prefers-reduced-motion`.
   ========================================================================== */

import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { PG1Glasses, Logomark, Wordmark } from '@/components/Brand'
import { Icon, type IconName } from '@/components/Icon'
import { Button, Label, Panel, Pill, cx } from '@/components/ui'
import { countUp, gsap, revealChildren, useGsap } from '@/lib/motion'
import { useSmoothScroll } from '@/lib/hooks'
import { SystemSections } from './sections/System'
import { CloseSections } from './sections/Close'

export default function Landing() {
  useSmoothScroll(true)

  return (
    <div className="relative bg-bg">
      <TopBar />
      <Hero />
      <Problem />
      <Gap />
      <SystemSections />
      <CloseSections />
    </div>
  )
}

/* ── Nav ─────────────────────────────────────────────────────────────────── */

function TopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Wordmark size={24} />
        <Link
          to="/app"
          className="press inline-flex h-9 items-center gap-1.5 rounded-sm border border-line-2 bg-surface-2 px-3.5 text-[13px] font-medium"
        >
          Open app
          <Icon name="arrow-up-right" size={14} />
        </Link>
      </div>
    </header>
  )
}

/* ── Hero ────────────────────────────────────────────────────────────────── */

function Hero() {
  const scope = useGsap<HTMLElement>((_, el) => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

    tl.from('[data-hero-eyebrow]', { y: 18, opacity: 0, duration: 0.7 })
      .from('[data-hero-line]', { yPercent: 108, opacity: 0, duration: 1.05, stagger: 0.08 }, '-=0.4')
      .from('[data-hero-body]', { y: 20, opacity: 0, duration: 0.8 }, '-=0.6')
      .from('[data-hero-cta] > *', { y: 16, opacity: 0, duration: 0.7, stagger: 0.07 }, '-=0.55')
      .from(
        '[data-hero-art]',
        { scale: 1.08, opacity: 0, duration: 1.6, ease: 'power3.out' },
        '-=1.2',
      )
      .from('[data-hero-chip]', { y: 12, opacity: 0, duration: 0.6, stagger: 0.06 }, '-=0.9')

    // Parallax the artwork out as the next section arrives.
    gsap.to('[data-hero-art]', {
      yPercent: -18,
      opacity: 0.15,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.5 },
    })
    gsap.to('[data-hero-copy]', {
      yPercent: -12,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: '60% top', scrub: 0.5 },
    })
  })

  return (
    <section
      ref={scope}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pt-14"
    >
      {/* engineering grid + horizon wash */}
      <div className="grid-field pointer-events-none absolute inset-0 opacity-[0.55]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(100% 62% at 50% 8%, rgba(12,107,117,0.12), transparent 62%), linear-gradient(180deg, transparent 40%, var(--color-bg) 92%)',
        }}
      />

      <div data-hero-art className="pointer-events-none absolute inset-x-0 top-[16vh] px-2">
        <PG1Glasses scanning className="mx-auto w-full max-w-3xl" />
      </div>

      <div data-hero-copy className="relative mx-auto w-full max-w-6xl px-5 pb-14">
        <div data-hero-eyebrow className="mb-5 flex flex-wrap items-center gap-2">
          <Pill tone="neutral" icon="aperture">
            Final-year project · B.Tech
          </Pill>
          <Pill tone="muted">Hardware · TinyML · IoT</Pill>
        </div>

        <h1 className="display-1 max-w-[15ch]">
          {['Nothing', 'watches you', 'unnoticed.'].map((line) => (
            <span key={line} className="block overflow-hidden">
              <span data-hero-line className="block">
                {line}
              </span>
            </span>
          ))}
        </h1>

        <p data-hero-body className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">
          PG-1 is a pair of glasses that reads five spectrums at once and tells you, in the corner
          of your vision, whether the room you just walked into is watching. No camera. No cloud.
          No account.
        </p>

        <div data-hero-cta className="mt-8 flex flex-wrap gap-2.5">
          <Link to="/app">
            <Button size="lg" variant="primary" iconAfter="arrow-up-right">
              Open the companion app
            </Button>
          </Link>
          <a href="#system">
            <Button size="lg" variant="quiet" icon="chevron-down">
              How it works
            </Button>
          </a>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
          {[
            ['5', 'sensor channels'],
            ['<120 g', 'worn weight'],
            ['3 h', 'field runtime'],
            ['0', 'bytes uploaded'],
          ].map(([v, l]) => (
            <div data-hero-chip key={l}>
              <div className="readout text-[19px] font-semibold leading-none">{v}</div>
              <div className="micro mt-1.5">{l.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2"
        aria-hidden
      >
        <Icon name="chevron-down" size={18} className="animate-bounce text-ink-4" />
      </div>
    </section>
  )
}

/* ── Problem ─────────────────────────────────────────────────────────────── */

const STATS = [
  {
    value: 10,
    prefix: '1 in ',
    label: 'Airbnb guests who report finding a hidden camera',
    note: 'Pinhole lenses behind smoke detectors, clocks and mirrors.',
  },
  {
    value: 400,
    suffix: '%',
    label: 'Rise in tracker-stalking cases over two years',
    note: 'Apple’s own alert can take hours to reach the victim.',
  },
  {
    value: 600,
    prefix: '₹',
    label: 'Cost of a working Wi-Fi spy camera today',
    note: 'The attack is cheap. The defence, until now, was not.',
  },
]

function Problem() {
  const scope = useGsap<HTMLElement>((_, el) => {
    revealChildren(el, '[data-reveal]', { y: 30, stagger: 0.09 })
    el.querySelectorAll<HTMLElement>('[data-count]').forEach((node) => {
      const to = Number(node.dataset.count)
      countUp(node, to, {
        prefix: node.dataset.prefix ?? '',
        suffix: node.dataset.suffix ?? '',
        duration: 1.5,
      })
    })
  })

  return (
    <section ref={scope} className="relative border-t border-line py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Label data-reveal>01 · THE PROBLEM</Label>
        <h2 data-reveal className="display-2 mt-4 max-w-[18ch]">
          Surveillance got cheap. Defence did not.
        </h2>
        <p data-reveal className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
          A camera that streams over hotel Wi-Fi costs less than dinner. A tracker that rides in
          your bag costs less than a coffee. What is missing is not the ability to detect them —
          it is a way to do it continuously, discreetly, and without becoming an expert first.
        </p>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {STATS.map((s) => (
            <Panel data-reveal key={s.label} className="p-5">
              <div
                className="readout text-[44px] font-semibold leading-none tracking-[-0.04em] text-ink"
                data-count={s.value}
                data-prefix={s.prefix ?? ''}
                data-suffix={s.suffix ?? ''}
              >
                {s.prefix ?? ''}0{s.suffix ?? ''}
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed font-medium text-ink">{s.label}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">{s.note}</p>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Gap analysis ────────────────────────────────────────────────────────── */

const COMPARISON: Array<{
  name: string
  price: string
  rows: Array<[string, boolean | 'partial']>
  verdict: string
}> = [
  {
    name: 'Phone apps',
    price: 'Free',
    rows: [
      ['Wi-Fi census', 'partial'],
      ['Tracker detection', 'partial'],
      ['RF power', false],
      ['EM field', false],
      ['Continuous', false],
      ['Discreet', false],
    ],
    verdict: 'Limited by the OS scan API, and only works while you hold it up and stare at it.',
  },
  {
    name: 'RF detectors',
    price: '₹3–6k',
    rows: [
      ['Wi-Fi census', false],
      ['Tracker detection', false],
      ['RF power', true],
      ['EM field', 'partial'],
      ['Continuous', 'partial'],
      ['Discreet', false],
    ],
    verdict: 'Sensitive, but it screams at your own router and looks like contraband in a hotel.',
  },
  {
    name: 'PG-1',
    price: '₹13.8k BOM',
    rows: [
      ['Wi-Fi census', true],
      ['Tracker detection', true],
      ['RF power', true],
      ['EM field', true],
      ['Continuous', true],
      ['Discreet', true],
    ],
    verdict: 'All five channels fused on-device, worn on your face, silent until it matters.',
  },
]

function Gap() {
  const scope = useGsap<HTMLElement>((_, el) => {
    revealChildren(el, '[data-reveal]', { y: 26, stagger: 0.08 })
  })

  return (
    <section ref={scope} className="relative border-t border-line py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Label data-reveal>02 · THE GAP</Label>
        <h2 data-reveal className="display-2 mt-4 max-w-[16ch]">
          Everything else does part of the job.
        </h2>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {COMPARISON.map((c, i) => {
            const ours = i === 2
            return (
              <Panel
                data-reveal
                key={c.name}
                className={cx('p-5', ours && 'iris-edge t-safe')}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[16px] font-semibold">{c.name}</h3>
                  <span className="readout text-[12px] text-ink-3">{c.price}</span>
                </div>

                <ul className="mt-4 space-y-2">
                  {c.rows.map(([label, state]) => (
                    <li key={label} className="flex items-center gap-2.5">
                      <span
                        className={cx(
                          'grid h-4 w-4 shrink-0 place-items-center rounded-full border',
                          state === true
                            ? 'border-safe/50 bg-safe/15 text-safe'
                            : state === 'partial'
                              ? 'border-caution/45 bg-caution/12 text-caution'
                              : 'border-line text-ink-4',
                        )}
                      >
                        <Icon
                          name={state === true ? 'check' : state === 'partial' ? 'minus' : 'close'}
                          size={10}
                          strokeWidth={2.4}
                        />
                      </span>
                      <span
                        className={cx(
                          'text-[13px]',
                          state === false ? 'text-ink-4' : 'text-ink-2',
                        )}
                      >
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 border-t border-line pt-3.5 text-[12.5px] leading-relaxed text-ink-3">
                  {c.verdict}
                </p>
              </Panel>
            )
          })}
        </div>
      </div>
    </section>
  )
}
