export function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Parses user input that may use a decimal comma («61,5»). Returns null if not a number. */
export function parseDecimal(input: string): number | null {
  const n = Number.parseFloat(input.trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
