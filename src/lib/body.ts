/** Body weight and measurements: fields, input parsing and the 7-day moving average. */
import type { BodyMetric } from '@/db/types'
import { addDaysKey, type DateKey } from './dates'
import { parseDecimal, roundTo } from './numbers'

export type BodyField = 'bodyweight' | 'waist' | 'chest' | 'arm' | 'thigh'

export const BODY_FIELDS: readonly {
  key: BodyField
  label: string
  unit: 'kg' | 'cm'
  min: number
  max: number
}[] = [
  { key: 'bodyweight', label: 'Peso', unit: 'kg', min: 20, max: 300 },
  { key: 'waist', label: 'Cintura', unit: 'cm', min: 30, max: 250 },
  { key: 'chest', label: 'Pecho', unit: 'cm', min: 30, max: 250 },
  { key: 'arm', label: 'Brazo', unit: 'cm', min: 10, max: 100 },
  { key: 'thigh', label: 'Muslo', unit: 'cm', min: 20, max: 150 },
]

/** Parses one field typed by the user: '' = not measured; out of range or not a number = error. */
export function parseBodyValue(
  field: BodyField,
  input: string,
): { value: number | null; error: string | null } {
  if (!input.trim()) return { value: null, error: null }
  const spec = BODY_FIELDS.find((f) => f.key === field)!
  const n = parseDecimal(input)
  if (n === null) return { value: null, error: 'Escribe un número, p. ej. 78,5' }
  if (n < spec.min || n > spec.max) {
    return { value: null, error: `Entre ${spec.min} y ${spec.max} ${spec.unit}` }
  }
  return { value: roundTo(n, 1), error: null }
}

export type BodyPoint = { date: DateKey; value: number }

/**
 * Mean of the values of the last `days` days (the day itself included) at every point, one
 * decimal. Gaps simply have fewer values; it never invents days without a weigh-in.
 */
export function movingAverage(points: BodyPoint[], days = 7): (BodyPoint & { average: number })[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((p) => {
    const from = addDaysKey(p.date, -(days - 1))
    const window = sorted.filter((q) => q.date >= from && q.date <= p.date)
    const mean = window.reduce((sum, q) => sum + q.value, 0) / window.length
    return { ...p, average: roundTo(mean, 1) }
  })
}

/** Points of one field, oldest first, skipping records without it. */
export function seriesOf(metrics: BodyMetric[], field: BodyField): BodyPoint[] {
  return metrics
    .filter((m) => m[field] !== null && !m.deletedAt)
    .map((m) => ({ date: m.date, value: m[field]! }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
