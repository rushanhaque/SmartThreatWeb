/* ============================================================================
   MOTION LAYER
   ----------------------------------------------------------------------------
   GSAP + ScrollTrigger, wired for a phone. Three rules the whole app obeys:

   1. Animate transform and opacity only. Nothing that triggers layout.
   2. Every effect is a no-op under `prefers-reduced-motion: reduce` — the
      final visual state is applied instantly instead of being skipped, so the
      page never ends up half-built.
   3. ScrollTrigger work is scoped to a `gsap.context` and reverted on unmount,
      because this is an SPA and orphaned triggers are the classic memory leak.
   ========================================================================== */

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const EASE = 'expo.out'
export const EASE_SOFT = 'power3.out'

gsap.defaults({ ease: EASE, duration: 0.9 })

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Scoped GSAP effect. Returns a ref to attach to the scope element.
 *
 *   const ref = useGsap((ctx, scope) => { gsap.from('.x', { y: 40 }) })
 *   <section ref={ref}> … </section>
 */
export function useGsap<T extends HTMLElement = HTMLDivElement>(
  effect: (self: gsap.Context, scope: T) => void,
  deps: unknown[] = [],
) {
  const scope = useRef<T>(null)

  useLayoutEffect(() => {
    if (!scope.current) return
    if (prefersReducedMotion()) return
    const ctx = gsap.context((self) => effect(self, scope.current as T), scope)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return scope
}

/** Standard section reveal: children rise and fade as the block enters view. */
export function revealChildren(
  scope: HTMLElement,
  selector: string,
  opts: { y?: number; stagger?: number; start?: string; duration?: number } = {},
) {
  const targets = scope.querySelectorAll(selector)
  if (!targets.length) return
  gsap.from(targets, {
    y: opts.y ?? 26,
    opacity: 0,
    duration: opts.duration ?? 0.85,
    stagger: opts.stagger ?? 0.07,
    ease: EASE,
    scrollTrigger: {
      trigger: scope,
      start: opts.start ?? 'top 78%',
      once: true,
    },
  })
}

/** Counts a numeric element up when it scrolls into view. */
export function countUp(
  el: HTMLElement,
  to: number,
  opts: { decimals?: number; prefix?: string; suffix?: string; duration?: number } = {},
) {
  const obj = { v: 0 }
  const d = opts.decimals ?? 0
  gsap.to(obj, {
    v: to,
    duration: opts.duration ?? 1.6,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    onUpdate() {
      el.textContent = `${opts.prefix ?? ''}${obj.v.toFixed(d)}${opts.suffix ?? ''}`
    },
  })
}

/** Refresh triggers after route-level layout shifts (fonts, images, tabs). */
export function refreshScroll() {
  requestAnimationFrame(() => ScrollTrigger.refresh())
}

export { gsap, ScrollTrigger }
