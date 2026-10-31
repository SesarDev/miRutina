import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { parseDuration } from './time'

gsap.registerPlugin(CustomEase)

export { parseDuration } from './time'

/** Fallbacks mirror src/styles/tokens.css; used when CSS is not available (tests, SSR). */
const FALLBACK = {
  '--dur-instant': '100ms',
  '--dur-fast': '150ms',
  '--dur-base': '250ms',
  '--dur-slow': '400ms',
  '--dur-stagger': '40ms',
  '--ease-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
  '--ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
  '--ease-spring': 'cubic-bezier(0.34, 1.36, 0.64, 1)',
  '--distance-micro': '4px',
  '--distance-small': '6px',
  '--distance-base': '8px',
  '--distance-medium': '12px',
} as const

export type DurationToken = 'instant' | 'fast' | 'base' | 'slow' | 'stagger'
export type EaseToken = 'out' | 'in-out' | 'spring'
export type DistanceToken = 'micro' | 'small' | 'base' | 'medium'

/** Extracts "x1,y1,x2,y2" from a CSS cubic-bezier(), the format CustomEase accepts. */
export function parseCubicBezier(value: string): string | null {
  const match = /cubic-bezier\(([^)]+)\)/.exec(value)
  if (!match?.[1]) return null
  const parts = match[1].split(',').map((p) => Number.parseFloat(p))
  if (parts.length !== 4 || parts.some((p) => !Number.isFinite(p))) return null
  return parts.join(',')
}

function readToken(name: keyof typeof FALLBACK): string {
  if (typeof document !== 'undefined') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    if (value) return value
  }
  return FALLBACK[name]
}

export function duration(token: DurationToken): number {
  if (prefersReducedMotion() && token !== 'instant') return 0
  return parseDuration(readToken(`--dur-${token}`))
}

/** Travel in px; 0 with reduced motion (tokens.css zeroes the distances). */
export function distance(token: DistanceToken): number {
  if (prefersReducedMotion()) return 0
  return Number.parseFloat(readToken(`--distance-${token}`)) || 0
}

const easeCache = new Map<EaseToken, string>()

/** Returns a GSAP ease name registered from the CSS easing token. */
export function ease(token: EaseToken): string {
  const cached = easeCache.get(token)
  if (cached) return cached
  const bezier = parseCubicBezier(readToken(`--ease-${token}`))
  const name = `mr-${token}`
  if (bezier) {
    CustomEase.create(name, bezier)
  } else {
    return 'power2.out'
  }
  easeCache.set(token, name)
  return name
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
