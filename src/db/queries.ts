/** Live reads for the UI (always from Dexie). */
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { buildIndex } from '@/lib/exerciseSearch'
import { db } from './schema'

const EMPTY: never[] = []

/** The whole catalogue (dataset + custom), indexed for search. Undefined while loading. */
export function useExerciseIndex() {
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const index = useMemo(() => (exercises ? buildIndex(exercises) : undefined), [exercises])
  return { index, total: index?.length ?? 0, loading: exercises === undefined }
}

/** undefined while loading, null if it does not exist. */
export function useExercise(id: string) {
  return useLiveQuery(async () => (await db.exercises.get(id)) ?? null, [id])
}

/** Ids of favourite exercises. */
export function useFavoriteIds(): ReadonlySet<string> {
  const settings = useLiveQuery(() => db.exerciseSettings.toArray(), [], EMPTY)
  return useMemo(
    () => new Set(settings.filter((s) => s.favorite && !s.deletedAt).map((s) => s.exerciseId)),
    [settings],
  )
}

/** My routines (not deleted), most recently edited first. */
export function useRoutines() {
  return useLiveQuery(
    async () =>
      (await db.routines.toArray())
        .filter((r) => !r.deletedAt)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [],
  )
}

/** undefined while loading, null if it does not exist. */
export function useRoutine(id: string) {
  return useLiveQuery(async () => (await db.routines.get(id)) ?? null, [id])
}

export function useRoutineTemplates() {
  return useLiveQuery(
    async () => (await db.routineTemplates.toArray()).sort((a, b) => a.position - b.position),
    [],
  )
}

/** Exercises by id for a set of ids (routine cards, editor). */
export function useExercisesById(ids: string[]) {
  const key = [...new Set(ids)].sort().join(',')
  return useLiveQuery(
    async () => {
      const unique = key ? key.split(',') : []
      const rows = await db.exercises.bulkGet(unique)
      return new Map(rows.filter((r) => r !== undefined).map((r) => [r.id, r]))
    },
    [key],
    new Map(),
  )
}

/** Date (YYYY-MM-DD) of the last finished session of each routine. */
export function useLastDoneByRoutine() {
  return useLiveQuery(
    async () => {
      const map = new Map<string, string>()
      for (const s of await db.sessions.toArray()) {
        if (!s.routineId || s.deletedAt || !s.endedAt) continue
        const prev = map.get(s.routineId)
        if (!prev || s.date > prev) map.set(s.routineId, s.date)
      }
      return map
    },
    [],
    new Map<string, string>(),
  )
}
