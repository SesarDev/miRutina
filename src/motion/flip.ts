/**
 * Flip helpers. A layout change is captured right before it happens (`capture`) and played
 * after React commits it (`play`, from a useGSAP/useLayoutEffect). Captures expire quickly so a
 * stale one never animates an unrelated change. Reduced motion: nothing is captured.
 */
import { duration, ease, prefersReducedMotion } from './tokens'
import { Flip, gsap } from './gsap'

const MAX_AGE_MS = 1500

export type FlipCapture = { state: Flip.FlipState; at: number }

export function capture(
  targets: Element[] | NodeListOf<Element>,
  props?: string,
): FlipCapture | null {
  if (prefersReducedMotion() || targets.length === 0) return null
  return { state: Flip.getState(targets, props ? { props } : undefined), at: Date.now() }
}

/** Animates `targets` from a capture; new elements fade in. Returns false if it did nothing. */
export function play(
  captured: FlipCapture | null,
  targets: Element[] | NodeListOf<Element>,
  vars: Flip.FromToVars = {},
): boolean {
  if (!captured || Date.now() - captured.at > MAX_AGE_MS || prefersReducedMotion()) return false
  const time = duration('base')
  Flip.from(captured.state, {
    targets,
    duration: time,
    ease: ease('out'),
    onEnter: (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: time }),
    ...vars,
  })
  return true
}

// ── Across routes: a thumbnail grows into the page it opens ──
// The source is gone after navigating, so the capture is a plain rect (viewport coordinates)
// and the destination plays the FLIP by hand: it starts at the thumbnail's place and size and
// settles into its own. Plain data can be replayed, so a remount (StrictMode) is harmless.

type RouteCapture = { id: string; rect: DOMRect; at: number }

let routeCapture: RouteCapture | null = null

/** Call on the click that navigates; `el` carries the shared `data-flip-id`. */
export function captureForRoute(el: Element | null) {
  const id = el?.getAttribute('data-flip-id')
  routeCapture =
    el && id && !prefersReducedMotion()
      ? { id, rect: el.getBoundingClientRect(), at: Date.now() }
      : null
}

/** On the destination: plays if the last capture was for this element's `data-flip-id`. */
export function playFromRoute(el: HTMLElement | null) {
  const captured = routeCapture
  const id = el?.getAttribute('data-flip-id')
  if (!el || !captured || captured.id !== id || Date.now() - captured.at > MAX_AGE_MS) return
  const to = el.getBoundingClientRect()
  if (!to.width) return
  gsap.from(el, {
    x: captured.rect.left - to.left,
    y: captured.rect.top - to.top,
    scale: captured.rect.width / to.width,
    transformOrigin: '0 0',
    zIndex: 2,
    duration: duration('base'),
    ease: ease('out'),
    clearProps: 'transform,zIndex',
    onComplete: () => {
      routeCapture = null
    },
  })
}
