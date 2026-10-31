/** Live reads for the UI (always from Dexie). */
import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { buildIndex } from '@/lib/exerciseSearch'
import { sortSets, summarizeSets, summaryFeel, type PastSession } from '@/lib/lastTime'
import { recordsBySession, sessionStats, workSets, type ExerciseRecord } from '@/lib/progress'
import { estimateMinutes } from '@/lib/routines'
import { db } from './schema'
import { addDaysKey, type DateKey } from '@/lib/dates'
import type { ExerciseSettings, Feel, PlannedWorkout, SetLog } from './types'

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

export type PlannedEntry = PlannedWorkout & { routineName: string; minutes: number }

/** Planned workouts between two dates (inclusive), with their routine's name and duration. */
export function usePlannedBetween(from: string, to: string) {
  return useLiveQuery(async () => {
    const rows = (
      await db.plannedWorkouts.where('date').between(from, to, true, true).toArray()
    ).filter((p) => !p.deletedAt)
    const routines = await db.routines.bulkGet([...new Set(rows.map((r) => r.routineId))])
    const byId = new Map(routines.filter((r) => r !== undefined).map((r) => [r.id, r]))
    return rows
      .map((p): PlannedEntry => {
        const routine = byId.get(p.routineId)
        return {
          ...p,
          routineName: routine && !routine.deletedAt ? routine.name : 'Rutina borrada',
          minutes: routine ? estimateMinutes(routine.items) : 0,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.updatedAt.localeCompare(b.updatedAt))
  }, [from, to])
}

/** Next planned (not skipped, not done) workout after `afterKey`. */
export function useNextPlanned(afterKey: string) {
  return useLiveQuery(async () => {
    const rows = await db.plannedWorkouts.where('date').above(afterKey).sortBy('date')
    const next = rows.find((p) => !p.deletedAt && p.status === 'planned')
    if (!next) return null
    const routine = await db.routines.get(next.routineId)
    return { ...next, routineName: routine?.name ?? 'Rutina borrada' }
  }, [afterKey])
}

/** Sessions between two dates (inclusive), not deleted. */
export function useSessionsBetween(from: string, to: string) {
  return useLiveQuery(
    async () =>
      (await db.sessions.where('date').between(from, to, true, true).toArray()).filter(
        (s) => !s.deletedAt,
      ),
    [from, to],
  )
}

export function useOpenSession() {
  return useLiveQuery(async () => {
    const open = (await db.sessions.toArray()).filter((s) => !s.endedAt && !s.deletedAt)
    return open.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null
  }, [])
}

export function useSession(id: string) {
  return useLiveQuery(async () => (await db.sessions.get(id)) ?? null, [id])
}

/**
 * The last `n` sessions with completed work sets of an exercise, most recent first (warm-ups,
 * unfinished rows and `excludeSessionId` — usually the session in progress — left out).
 */
export async function lastSessionsForExercise(
  exerciseId: string,
  { n = 2, excludeSessionId }: { n?: number; excludeSessionId?: string } = {},
): Promise<PastSession[]> {
  // Rows without completedAt are not in the compound index.
  const logs = await db.setLogs
    .where('[exerciseId+completedAt]')
    .between([exerciseId, Dexie.minKey], [exerciseId, Dexie.maxKey])
    .reverse()
    .toArray()

  const bySession = new Map<string, typeof logs>()
  for (const log of logs) {
    if (log.deletedAt || log.isWarmup || log.sessionId === excludeSessionId) continue
    const list = bySession.get(log.sessionId)
    if (list) list.push(log)
    else if (bySession.size < n * 2) bySession.set(log.sessionId, [log])
  }

  const sessions = await db.sessions.bulkGet([...bySession.keys()])
  const out: PastSession[] = []
  for (const session of sessions) {
    if (!session || session.deletedAt || out.length === n) continue
    out.push({
      sessionId: session.id,
      date: session.date,
      sets: sortSets(bySession.get(session.id)!),
    })
  }
  return out
}

export function useLastSessions(exerciseId: string, excludeSessionId?: string) {
  return useLiveQuery(
    () => lastSessionsForExercise(exerciseId, { excludeSessionId }),
    [exerciseId, excludeSessionId],
  )
}

/** Rows of a session (not deleted), by exercise and set. */
export function useSessionRows(sessionId: string) {
  return useLiveQuery(
    async () =>
      (await db.setLogs.where('sessionId').equals(sessionId).toArray())
        .filter((r) => !r.deletedAt)
        .sort((a, b) => a.order - b.order || a.dropIndex - b.dropIndex),
    [sessionId],
  )
}

/** Settings of some exercises (weight step, notes), by exercise id. */
export function useExerciseSettingsById(ids: string[]) {
  const key = [...new Set(ids)].sort().join(',')
  return useLiveQuery(
    async () => {
      const rows = await db.exerciseSettings.bulkGet(key ? key.split(',') : [])
      return new Map(rows.filter((r) => r !== undefined).map((r) => [r.exerciseId, r]))
    },
    [key],
    new Map<string, ExerciseSettings>(),
  )
}

/** One past session of an exercise, with its completed rows (warm-ups and drops included). */
export type HistorySession = {
  sessionId: string
  date: DateKey
  startedAt: string
  sets: SetLog[]
}

/**
 * Every session with completed rows of an exercise, most recent first. Rows of deleted sessions
 * or deleted rows are left out; filtering warm-ups is up to the caller (`lib/progress`).
 */
export async function exerciseHistory(exerciseId: string): Promise<HistorySession[]> {
  const logs = await db.setLogs
    .where('[exerciseId+completedAt]')
    .between([exerciseId, Dexie.minKey], [exerciseId, Dexie.maxKey])
    .toArray()

  const bySession = new Map<string, SetLog[]>()
  for (const log of logs) {
    if (log.deletedAt) continue
    const list = bySession.get(log.sessionId)
    if (list) list.push(log)
    else bySession.set(log.sessionId, [log])
  }

  const sessions = await db.sessions.bulkGet([...bySession.keys()])
  return sessions
    .filter((s) => s !== undefined && !s.deletedAt)
    .map((s) => ({
      sessionId: s!.id,
      date: s!.date,
      startedAt: s!.startedAt,
      sets: sortSets(bySession.get(s!.id)!),
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt))
}

/** undefined while loading. */
export function useExerciseHistory(exerciseId: string) {
  return useLiveQuery(() => exerciseHistory(exerciseId), [exerciseId])
}

export type RecentExercise = {
  exerciseId: string
  name: string
  lastDate: DateKey
  /** Heaviest set per session (most reps for bodyweight work), oldest first. */
  trend: { date: DateKey; value: number }[]
  trendUnit: 'kg' | 'reps'
  lastFeel: Feel | null
  lastSets: string
}

export type RecentRecord = ExerciseRecord & { name: string }

/** /progreso: exercises of the last 90 days, records of the last 30 and the trained days. */
export async function progressOverview(today: DateKey) {
  const since90 = addDaysKey(today, -89)
  const since30 = addDaysKey(today, -29)
  const sessions = (
    await db.sessions.where('date').between(since90, today, true, true).toArray()
  ).filter((s) => !s.deletedAt)
  const logs = (
    await db.setLogs
      .where('sessionId')
      .anyOf(sessions.map((s) => s.id))
      .toArray()
  ).filter((l) => !l.deletedAt && l.completedAt)

  const dateOf = new Map(sessions.map((s) => [s.id, s.date]))
  const trainedDates = new Set(workSets(logs).map((l) => dateOf.get(l.sessionId)!))
  const ids = [...new Set(workSets(logs).map((l) => l.exerciseId))]
  const names = new Map(
    (await db.exercises.bulkGet(ids)).filter((e) => e !== undefined).map((e) => [e.id, e.nameEs]),
  )

  const exercises: RecentExercise[] = []
  const records: RecentRecord[] = []
  for (const exerciseId of ids) {
    const name = names.get(exerciseId) ?? 'Ejercicio'
    const history = await exerciseHistory(exerciseId)
    const recent = history.filter((h) => h.date >= since90 && workSets(h.sets).length)
    const last = recent[0]
    if (!last) continue

    const stats = recent.map((h) => ({ date: h.date, stats: sessionStats(h.sets) })).reverse()
    const byWeight = stats.some((s) => s.stats.maxWeight !== null)
    const lastWork = workSets(last.sets)
    exercises.push({
      exerciseId,
      name,
      lastDate: last.date,
      trend: stats.flatMap(({ date, stats: s }) => {
        const value = byWeight ? s.maxWeight : s.maxReps
        return value === null ? [] : [{ date, value }]
      }),
      trendUnit: byWeight ? 'kg' : 'reps',
      lastFeel: summaryFeel(lastWork),
      lastSets: summarizeSets(lastWork),
    })

    for (const list of recordsBySession(exerciseId, history).values()) {
      for (const r of list) if (r.date >= since30) records.push({ ...r, name })
    }
  }

  exercises.sort((a, b) => b.lastDate.localeCompare(a.lastDate) || a.name.localeCompare(b.name))
  records.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name))
  return { exercises, records, trainedDates }
}

export function useProgressOverview(today: DateKey) {
  return useLiveQuery(() => progressOverview(today), [today])
}
