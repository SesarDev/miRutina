/**
 * What a session changed with respect to its routine, to offer «¿Guardar estos cambios en la
 * rutina?» at the end: exercises added, a new order, and a different number of sets. A skipped
 * exercise is not a removal (it was just not done today).
 */
import type { RoutineItem, SessionItem, SetLog } from '@/db/types'
import { withOrder } from './routines'

export type RoutineChange =
  | { kind: 'added'; exerciseId: string }
  | { kind: 'order' }
  | { kind: 'sets'; exerciseId: string; from: number; to: number }

type Row = Pick<SetLog, 'exerciseId' | 'isWarmup' | 'dropIndex' | 'completedAt' | 'order'>

/** Work sets done of an exercise (drops and warm-ups are not sets of their own). */
function setsDone(rows: Row[], exerciseId: string): number {
  const orders = rows
    .filter((r) => r.exerciseId === exerciseId && !r.isWarmup && r.dropIndex === 0 && r.completedAt)
    .map((r) => r.order)
  return new Set(orders).size
}

export function routineChanges(
  routineItems: RoutineItem[],
  sessionItems: SessionItem[],
  rows: Row[],
): { changes: RoutineChange[]; items: RoutineItem[] } {
  const byExercise = new Map(routineItems.map((i) => [i.exerciseId, i]))
  const changes: RoutineChange[] = []

  for (const item of sessionItems) {
    if (!byExercise.has(item.exerciseId))
      changes.push({ kind: 'added', exerciseId: item.exerciseId })
  }

  const common = sessionItems.map((i) => i.exerciseId).filter((id) => byExercise.has(id))
  const before = routineItems.map((i) => i.exerciseId).filter((id) => common.includes(id))
  if (common.join() !== before.join()) changes.push({ kind: 'order' })

  const items = sessionItems.map((sessionItem) => {
    const { skipped, note: _note, ...plain } = sessionItem
    const base = byExercise.get(sessionItem.exerciseId) ?? plain
    const done = setsDone(rows, sessionItem.exerciseId)
    // Pyramids carry reps per set: their number of sets stays as designed.
    if (!skipped && done > 0 && done !== base.sets && base.technique !== 'ascendente') {
      changes.push({ kind: 'sets', exerciseId: base.exerciseId, from: base.sets, to: done })
      return { ...base, sets: done }
    }
    return base
  })

  return { changes, items: withOrder(items) }
}
