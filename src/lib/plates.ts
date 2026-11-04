/**
 * Plates to load on each side of a bar for a weight the user chose. It only breaks the weight
 * down; it never proposes one (CLAUDE.md · reglas de producto).
 */
import { roundTo } from './numbers'

/** Standard gym plates (kg), heaviest first. */
export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const

export const BAR_WEIGHTS = [20, 15, 10] as const

/** Equipment (dataset keys) loaded with plates on a bar. */
export const PLATE_EQUIPMENT = new Set(['barbell', 'olympic barbell', 'ez barbell', 'trap bar'])

export type PlateLoad =
  { kind: 'ok'; perSide: number[]; sideKg: number; remainder: number } | { kind: 'below-bar' }

export function platesPerSide(
  total: number,
  bar: number,
  plates: readonly number[] = PLATES,
): PlateLoad {
  if (total < bar) return { kind: 'below-bar' }
  let side = roundTo((total - bar) / 2, 3)
  const perSide: number[] = []
  for (const plate of plates) {
    while (side + 1e-9 >= plate) {
      perSide.push(plate)
      side = roundTo(side - plate, 3)
    }
  }
  const sideKg = roundTo(
    perSide.reduce((sum, p) => sum + p, 0),
    2,
  )
  // What is left over in total (both sides), when the plates cannot make it exactly.
  return { kind: 'ok', perSide, sideKg, remainder: roundTo(side * 2, 2) }
}
