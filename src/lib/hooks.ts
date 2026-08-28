import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { ScrollTrigger, prefersReducedMotion } from './motion'

/* ── Smooth scroll ────────────────────────────────────────────────────────
   Desktop gets Lenis interpolation. Touch keeps the browser's native
   momentum: hijacking it on a phone costs a frame budget we do not have and
   always feels a little wrong under the thumb. ScrollTrigger is driven off
   Lenis' rAF so the two never fight for the scroll position.               */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.6,
    })

    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsapTicker(raf)

    // Exposed in dev only, so scroll choreography can be driven from the
    // console (or an automated pass) without faking untrusted wheel events.
    if (import.meta.env.DEV) {
      ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
    }

    return () => {
      removeGsapTicker(raf)
      lenis.destroy()
      if (import.meta.env.DEV) {
        delete (window as unknown as { __lenis?: Lenis }).__lenis
      }
    }
  }, [enabled])
}

// Kept in one place so the ticker import does not leak into feature code.
import { gsap } from './motion'
function gsapTicker(fn: (t: number) => void) {
  gsap.ticker.add(fn)
  gsap.ticker.lagSmoothing(0)
}
function removeGsapTicker(fn: (t: number) => void) {
  gsap.ticker.remove(fn)
}

/* ── Media query ─────────────────────────────────────────────────────────── */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}

export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/* ── In-view ─────────────────────────────────────────────────────────────
   Used to park expensive canvas/SVG animation when a widget scrolls away. */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { rootMargin: '80px', threshold: 0.01 },
) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), options)
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return [ref, inView] as const
}

/* ── Animated number ─────────────────────────────────────────────────────
   Eases a displayed value toward its target so the big threat score never
   snaps between readings. Runs on rAF, stops dead when settled.           */
export function useSpringNumber(target: number, stiffness = 0.16) {
  const [value, setValue] = useState(target)
  const raf = useRef(0)
  const current = useRef(target)

  useEffect(() => {
    if (prefersReducedMotion()) {
      current.current = target
      setValue(target)
      return
    }
    const step = () => {
      const delta = target - current.current
      if (Math.abs(delta) < 0.35) {
        current.current = target
        setValue(target)
        return
      }
      current.current += delta * stiffness
      setValue(current.current)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, stiffness])

  return value
}

/* ── Ticking clock, 1 Hz, shared cadence with telemetry ──────────────────── */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

/* ── Body scroll lock for sheets and full-screen flows ───────────────────── */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}

/* ── Haptics ─────────────────────────────────────────────────────────────
   Mirrors the glasses' own buzz patterns so the phone and the temple arm
   speak the same language: safe = silence, watch = one tap, threat = two. */
export const HAPTIC = {
  tap: [8],
  watch: [18],
  threat: [42, 60, 42],
  success: [10, 40, 10],
} as const

export function haptic(pattern: keyof typeof HAPTIC = 'tap') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(HAPTIC[pattern] as unknown as number[])
    } catch {
      /* unsupported — the visual and audio channels still fire */
    }
  }
}
