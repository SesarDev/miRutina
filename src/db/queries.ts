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
