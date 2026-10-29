/** Planned workouts on the calendar. All writes go through repo.save / softDelete. */
import { uuid } from '@/lib/uuid'
import { addWeeksKey, type DateKey } from '@/lib/dates'
import { save, softDelete } from './repo'
import { db } from './schema'
import type { PlannedStatus, PlannedWorkout } from './types'

export const MAX_REPEAT_WEEKS = 12

/**
 * Plans a routine on a day. `weeks` > 1 also plans the same weekday for the following weeks
 * (no recurrence rule is stored: each week is its own row).
 */
export async function planWorkout(
  date: DateKey,
  routineId: string,
  weeks = 1,
): Promise<PlannedWorkout[]> {
  const count = Math.min(Math.max(1, weeks), MAX_REPEAT_WEEKS)
  const created: PlannedWorkout[] = []
  for (let w = 0; w < count; w++) {
    created.push(
      await save('plannedWorkouts', {
        id: uuid(),
        date: addWeeksKey(date, w),
        routineId,
        status: 'planned',
        sessionId: null,
      }),
    )
  }
  return created
}

async function update(
  id: string,
  patch: Partial<Pick<PlannedWorkout, 'date' | 'status' | 'deletedAt'>>,
) {
  const row = await db.plannedWorkouts.get(id)
  if (!row) return undefined
  return save('plannedWorkouts', { ...row, ...patch })
}

export const moveWorkout = (id: string, date: DateKey) => update(id, { date })

export const setWorkoutStatus = (id: string, status: PlannedStatus) => update(id, { status })

export const removeWorkout = (id: string) => softDelete('plannedWorkouts', id)

export const restoreWorkout = (id: string) => update(id, { deletedAt: null })
