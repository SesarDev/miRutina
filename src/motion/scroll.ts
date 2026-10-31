/**
 * Scroll-linked entrances, used with restraint (docs/phases/F5): each runs once per mount, never
 * pins or scrubs, and does nothing with reduced motion. Positions are refreshed when the scope
 * changes size, since lists and charts grow after their data arrives.
 */
import type { RefObject } from 'react'
import { duration, distance, ease, prefersReducedMotion } from './tokens'
import { gsap, ScrollTrigger, useGSAP } from './gsap'

/** Keeps ScrollTrigger positions in step with a container that changes height. */
function refreshOnResize(el: Element) {
  let frame = 0
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => ScrollTrigger.refresh())
  })
  observer.observe(el)
  return () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
  }
}

/**
 * Items matching `selector` inside `scope` rise into place in small staggered batches as they
 * enter the viewport (ScrollTrigger.batch, once). Runs when `ready` turns true (data loaded);
 * items added later simply appear.
 */
export function useRevealBatch(
  scope: RefObject<HTMLElement | null>,
  selector: string,
  ready: boolean,
) {
  useGSAP(
    () => {
      const root = scope.current
      if (!ready || !root || prefersReducedMotion()) return
      const items = gsap.utils.toArray<HTMLElement>(selector, root)
      if (!items.length) return
      gsap.set(items, { autoAlpha: 0, y: distance('medium') })
      ScrollTrigger.batch(items, {
        once: true,
        start: 'top 95%',
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: duration('base'),
            ease: ease('out'),
            stagger: duration('stagger'),
            overwrite: true,
            clearProps: 'transform,visibility,opacity',
          }),
      })
      return refreshOnResize(root)
    },
    { scope, dependencies: [ready] },
  )
}

/**
 * The first time the chart in `scope` scrolls into view, its solid lines (`.t-draw` series)
 * draw themselves from left to right. Recharts draws after measuring, so it waits for the path.
 */
export function useDrawLines(scope: RefObject<HTMLElement | null>, ready: boolean) {
  useGSAP(
    (_context, contextSafe) => {
      const root = scope.current
      if (!ready || !root || prefersReducedMotion() || !contextSafe) return
      let tries = 0
      const draw = contextSafe(() => {
        const paths = root.querySelectorAll<SVGPathElement>('.t-draw .recharts-line-curve')
        if (!paths.length && tries++ < 30) {
          requestAnimationFrame(draw)
          return
        }
        for (const path of paths) {
          const length = Math.ceil(path.getTotalLength())
          gsap.fromTo(
            path,
            { strokeDasharray: length, strokeDashoffset: length },
            {
              strokeDashoffset: 0,
              duration: duration('slow'),
              ease: ease('out'),
              clearProps: 'strokeDasharray,strokeDashoffset',
            },
          )
        }
      })
      ScrollTrigger.create({ trigger: root, start: 'top 90%', once: true, onEnter: draw })
      return refreshOnResize(root)
    },
    { scope, dependencies: [ready] },
  )
}
