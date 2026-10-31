/**
 * Progress of an exercise: estimated 1RM, per-session stats and records. Everything is computed
 * from `setLogs` and never stored (CLAUDE.md · Modelo de datos). Records describe what happened;
 * they never turn into a suggestion of today's weight.
 */
import type { SetLog } from '@/db/types'
import type { DateKey } from './dates'
import { roundTo } from './numbers'

/** Epley is unreliable above this many reps, so those sets have no estimate. */
export const MAX_1RM_REPS = 12

export type ProgressSet = Pick<
  SetLog,
  'weight' | 'reps' | 'isWarmup' | 'completedAt' | 'dropIndex'
> & {
  id?: string
}

/** One exercise in one session (all of its rows; warm-ups and unfinished ones are filtered here). */
export type ExerciseSession = {
  sessionId: string
  date: DateKey
  /** Orders sessions of the same day. */
  startedAt: string
  sets: ProgressSet[]
}

/** Epley: `w × (1 + r / 30)`, one decimal. null for warm-ups, no weight or reps outside 1–12. */
export function estimated1RM(
  weight: number | null,
  reps: number | null,
  isWarmup = false,
): number | null {
  if (isWarmup || weight === null || weight <= 0 || reps === null) return null
  if (reps < 1 || reps > MAX_1RM_REPS) return null
  return roundTo(weight * (1 + reps / 30), 1)
}

/** Completed work sets: no warm-ups, no rows left unmarked, at least one rep. */
export function workSets<T extends ProgressSet>(sets: T[]): T[] {
  return sets.filter((s) => !s.isWarmup && s.completedAt && (s.reps ?? 0) > 0)
}

/** Work sets that are not the chained drops of a drop set: they define weights and reps. */
function mainSets<T extends ProgressSet>(sets: T[]): T[] {
  return workSets(sets).filter((s) => s.dropIndex === 0)
}

export type SessionStats = {
  /** Heaviest set (most reps on a tie); for bodyweight work, the one with most reps. */
  bestSet: { weight: number | null; reps: number } | null
  /** Σ weight × reps of all work sets, drops included (kg, rounded). */
  volume: number
  best1RM: number | null
  maxWeight: number | null
  /** Most reps in a single set. */
  maxReps: number | null
}

export function sessionStats(sets: ProgressSet[]): SessionStats {
  const work = workSets(sets)
  const main = mainSets(sets)

  let bestSet: SessionStats['bestSet'] = null
  let best1RM: number | null = null
  let maxWeight: number | null = null
  let maxReps: number | null = null
  for (const s of main) {
    const reps = s.reps!
    const w = s.weight ?? 0
    const bw = bestSet?.weight ?? 0
    if (!bestSet || w > bw || (w === bw && reps > bestSet.reps)) {
      bestSet = { weight: s.weight, reps }
    }
    const e = estimated1RM(s.weight, reps)
    if (e !== null && (best1RM === null || e > best1RM)) best1RM = e
    if (s.weight !== null && s.weight > 0 && (maxWeight === null || s.weight > maxWeight)) {
      maxWeight = s.weight
    }
    if (maxReps === null || reps > maxReps) maxReps = reps
  }

  const volume = Math.round(work.reduce((sum, s) => sum + (s.weight ?? 0) * s.reps!, 0))
  return { bestSet, volume, best1RM, maxWeight, maxReps }
}

export type RecordKind = 'weight' | 'reps' | 'e1rm' | 'volume'

export const RECORD_LABELS: Record<RecordKind, string> = {
  weight: 'Más peso',
  reps: 'Más reps',
  e1rm: 'Mejor 1RM estimado',
  volume: 'Más volumen',
}

export type ExerciseRecord = {
  kind: RecordKind
  exerciseId: string
  sessionId: string
  date: DateKey
  /** kg for weight, e1rm and volume; reps for «reps». */
  value: number
  /** The best value before this session. */
  previous: number
  /** «reps»: the weight it was done with (null = bodyweight). */
  weight?: number | null
  /** The set that made it, when the record belongs to one set. */
  setId?: string
}

/** Weight as a map key: one decimal, bodyweight (no weight) as its own key. */
const weightKey = (w: number | null) => (w === null || w <= 0 ? 'bw' : roundTo(w, 1).toFixed(1))

function bestRepsByWeight(sets: ProgressSet[]) {
  const best = new Map<string, ProgressSet>()
  for (const s of mainSets(sets)) {
    const key = weightKey(s.weight)
    const prev = best.get(key)
    if (!prev || s.reps! > prev.reps!) best.set(key, s)
  }
  return best
}

function bestBy(sets: ProgressSet[], value: (s: ProgressSet) => number | null) {
  let best: { set: ProgressSet; value: number } | null = null
  for (const s of mainSets(sets)) {
    const v = value(s)
    if (v !== null && (!best || v > best.value)) best = { set: s, value: v }
  }
  return best
}

const chronological = (a: ExerciseSession, b: ExerciseSession) =>
  a.date.localeCompare(b.date) || a.startedAt.localeCompare(b.startedAt)

/**
 * Records of `session` against the sessions before it (only earlier ones in `history` count;
 * the session itself and later ones are ignored). The first session ever has nothing to beat,
 * so it has no records. «Más reps» compares with the same weight only.
 */
export function detectRecords(
  exerciseId: string,
  session: ExerciseSession,
  history: ExerciseSession[],
): ExerciseRecord[] {
  const earlier = history.filter(
    (h) => h.sessionId !== session.sessionId && chronological(h, session) < 0,
  )
  const before = earlier.flatMap((h) => h.sets)
  if (!workSets(before).length || !workSets(session.sets).length) return []

  const base = { exerciseId, sessionId: session.sessionId, date: session.date }
  const out: ExerciseRecord[] = []
  const weightOf = (s: ProgressSet) => (s.weight !== null && s.weight > 0 ? s.weight : null)
  const e1rmOf = (s: ProgressSet) => estimated1RM(s.weight, s.reps)

  const heaviest = bestBy(session.sets, weightOf)
  const prevHeaviest = bestBy(before, weightOf)
  if (heaviest && prevHeaviest && heaviest.value > prevHeaviest.value) {
    out.push({
      ...base,
      kind: 'weight',
      value: heaviest.value,
      previous: prevHeaviest.value,
      setId: heaviest.set.id,
    })
  }

  const prevReps = bestRepsByWeight(before)
  for (const [key, s] of bestRepsByWeight(session.sets)) {
    const prev = prevReps.get(key)
    if (prev && s.reps! > prev.reps!) {
      out.push({
        ...base,
        kind: 'reps',
        value: s.reps!,
        previous: prev.reps!,
        weight: weightOf(s),
        setId: s.id,
      })
    }
  }

  const e1rm = bestBy(session.sets, e1rmOf)
  const prevE1rm = bestBy(before, e1rmOf)
  if (e1rm && prevE1rm && e1rm.value > prevE1rm.value) {
    out.push({
      ...base,
      kind: 'e1rm',
      value: e1rm.value,
      previous: prevE1rm.value,
      setId: e1rm.set.id,
    })
  }

  const volume = sessionStats(session.sets).volume
  const prevVolume = Math.max(...earlier.map((h) => sessionStats(h.sets).volume))
  if (volume > 0 && prevVolume > 0 && volume > prevVolume) {
    out.push({ ...base, kind: 'volume', value: volume, previous: prevVolume })
  }

  return out
}

/** Records of every session of an exercise, each against the ones before it. By session id. */
export function recordsBySession(
  exerciseId: string,
  sessions: ExerciseSession[],
): Map<string, ExerciseRecord[]> {
  const sorted = [...sessions].sort(chronological)
  const out = new Map<string, ExerciseRecord[]>()
  for (let i = 1; i < sorted.length; i++) {
    const session = sorted[i]!
    const records = detectRecords(exerciseId, session, sorted.slice(0, i))
    if (records.length) out.set(session.sessionId, records)
  }
  return out
}

type Best = { value: number; date: DateKey }

export type PersonalRecords = {
  /** With the reps of that set; the first time it was reached. */
  maxWeight: (Best & { reps: number }) | null
  best1RM: Best | null
  bestVolume: Best | null
  /** Most reps in one set (what matters for bodyweight work). */
  maxReps: (Best & { weight: number | null }) | null
}

/** Current personal bests of an exercise. Ties keep the earliest date: that is when it was set. */
export function personalRecords(sessions: ExerciseSession[]): PersonalRecords {
  const out: PersonalRecords = { maxWeight: null, best1RM: null, bestVolume: null, maxReps: null }
  for (const session of [...sessions].sort(chronological)) {
    const { date } = session
    for (const s of mainSets(session.sets)) {
      const reps = s.reps!
      if (s.weight !== null && s.weight > 0) {
        const cur = out.maxWeight
        if (!cur || s.weight > cur.value || (s.weight === cur.value && reps > cur.reps)) {
          out.maxWeight = { value: s.weight, reps, date }
        }
      }
      const e = estimated1RM(s.weight, reps)
      if (e !== null && (!out.best1RM || e > out.best1RM.value)) out.best1RM = { value: e, date }
      if (!out.maxReps || reps > out.maxReps.value)
        out.maxReps = { value: reps, weight: s.weight, date }
    }
    const { volume } = sessionStats(session.sets)
    if (volume > 0 && (!out.bestVolume || volume > out.bestVolume.value)) {
      out.bestVolume = { value: volume, date }
    }
  }
  return out
}
