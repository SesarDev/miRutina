export function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

const weightFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })

/** «62,5», «60». kg are stored with one decimal at most. */
export function formatWeight(kg: number): string {
  return weightFormat.format(roundTo(kg, 1))
}

/** Parses user input that may use a decimal comma («61,5»). Returns null if not a number. */
export function parseDecimal(input: string): number | null {
  const n = Number.parseFloat(input.trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
