/** CSS time helpers without GSAP, safe to import from the first-load bundle. */

/** Parses a CSS time ("250ms", "0.25s") into seconds, as GSAP expects. */
export function parseDuration(value: string): number {
  const v = value.trim()
  if (v.endsWith('ms')) return Number.parseFloat(v) / 1000
  if (v.endsWith('s')) return Number.parseFloat(v)
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n / 1000 : 0
}
