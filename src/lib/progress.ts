/**
 * Progress of an exercise: estimated 1RM, per-session stats and records. Everything is computed
 * from `setLogs` and never stored (CLAUDE.md · Modelo de datos). Records describe what happened;
 * they never turn into a suggestion of today's weight.
 */
import type { SetLog } from '@/db/types'
import { addDaysKey, addMonthsKey, weekDays, type DateKey } from './dates'
import { formatWeight, roundTo } from './numbers'

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

// ── Text ──

/** «60 kg × 10», «12 reps» (bodyweight). */
export function formatSet(set: Pick<SetLog, 'weight' | 'reps'>): string {
  if (set.weight === null || set.weight <= 0) return `${set.reps ?? 0} reps`
  return `${formatWeight(set.weight)} kg × ${set.reps ?? 0}`
}

const kg = (n: number) => `${formatWeight(n)} kg`
const volumeFormat = new Intl.NumberFormat('es-ES')

/** «Más peso: 65 kg (antes 60 kg)», «Más reps con 60 kg: 11 (antes 10)». */
export function formatRecord(record: ExerciseRecord): string {
  switch (record.kind) {
    case 'weight':
      return `Más peso: ${kg(record.value)} (antes ${kg(record.previous)})`
    case 'reps': {
      const at = record.weight ? kg(record.weight) : 'peso corporal'
      return `Más reps con ${at}: ${record.value} (antes ${record.previous})`
    }
    case 'e1rm':
      return `Mejor 1RM estimado: ${kg(record.value)} (antes ${kg(record.previous)})`
    case 'volume':
      return `Más volumen: ${volumeFormat.format(record.value)} kg (antes ${volumeFormat.format(record.previous)} kg)`
  }
}

// ── Chart ──

export type ChartMetric = 'weight' | 'e1rm' | 'volume' | 'reps'

export const CHART_METRIC_LABELS: Record<ChartMetric, string> = {
  weight: 'Peso máximo',
  e1rm: '1RM estimado',
  volume: 'Volumen',
  reps: 'Reps máximas',
}

/** «reps» for the reps metric, kg for the rest. */
export const metricUnit = (metric: ChartMetric) => (metric === 'reps' ? 'reps' : 'kg')

export function metricOf(stats: SessionStats, metric: ChartMetric): number | null {
  if (metric === 'weight') return stats.maxWeight
  if (metric === 'e1rm') return stats.best1RM
  if (metric === 'reps') return stats.maxReps
  return stats.volume > 0 ? stats.volume : null
}

/** Metrics that make sense for an exercise: bodyweight work has only reps. */
export function metricsFor(withWeight: boolean): ChartMetric[] {
  return withWeight ? ['weight', 'e1rm', 'volume', 'reps'] : ['reps']
}

export type ChartRange = '1m' | '3m' | '1y' | 'all'

export const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  '1m': '1 mes',
  '3m': '3 meses',
  '1y': '1 año',
  all: 'Todo',
}

/** First day shown by a range (inclusive), or null for «Todo». */
export function rangeStart(range: ChartRange, today: DateKey): DateKey | null {
  if (range === 'all') return null
  const months = { '1m': 1, '3m': 3, '1y': 12 }[range]
  return addDaysKey(addMonthsKey(today, -months), 1)
}

// ── Consistency ──

export type ConsistencyWeek = {
  /** Monday of the week. */
  start: DateKey
  /** Monday … Sunday, each with whether it was trained (future days of this week: null). */
  days: { date: DateKey; trained: boolean | null }[]
  count: number
}

/** The last `weeks` weeks (Monday first, this one last) with the days that were trained. */
export function consistencyWeeks(
  trainedDates: Iterable<DateKey>,
  today: DateKey,
  weeks = 12,
): ConsistencyWeek[] {
  const trained = new Set(trainedDates)
  const out: ConsistencyWeek[] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const days = weekDays(addDaysKey(today, -7 * w)).map((date) => ({
      date,
      trained: date > today ? null : trained.has(date),
    }))
    out.push({ start: days[0]!.date, days, count: days.filter((d) => d.trained).length })
  }
  return out
}

// ── Grouping ──

/**
 * Records of a period grouped by exercise, most recent exercise first. For each kind (and, for
 * «más reps», each weight) only the latest record stays: it is the current best.
 */
export function groupRecords<T extends ExerciseRecord>(
  records: T[],
): { exerciseId: string; date: DateKey; records: T[] }[] {
  const byExercise = new Map<string, Map<string, T>>()
  for (const r of [...records].sort((a, b) => a.date.localeCompare(b.date))) {
    const kinds = byExercise.get(r.exerciseId) ?? new Map<string, T>()
    kinds.set(`${r.kind}:${r.weight ?? ''}`, r)
    byExercise.set(r.exerciseId, kinds)
  }
  return [...byExercise.entries()]
    .map(([exerciseId, kinds]) => {
      const list = [...kinds.values()]
      return {
        exerciseId,
        date: list.reduce((d, r) => (r.date > d ? r.date : d), ''),
        records: list,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export type MuscleWeek = { bodyPart: string; sets: number; previous: number }

/**
 * Work sets per body part this week (Monday to today) next to the whole previous week.
 * `rows` carry the date of their session and the body part of their exercise.
 */
export function setsByBodyPart(
  rows: {
    date: DateKey
    bodyPart: string
    isWarmup: boolean
    dropIndex: number
    completedAt: string | null
  }[],
  today: DateKey,
): MuscleWeek[] {
  const monday = weekDays(today)[0]!
  const previousMonday = addDaysKey(monday, -7)
  const out = new Map<string, MuscleWeek>()
  for (const r of rows) {
    if (r.isWarmup || r.dropIndex > 0 || !r.completedAt || !r.bodyPart) continue
    const entry = out.get(r.bodyPart) ?? { bodyPart: r.bodyPart, sets: 0, previous: 0 }
    if (r.date >= monday && r.date <= today) entry.sets++
    else if (r.date >= previousMonday && r.date < monday) entry.previous++
    else continue
    out.set(r.bodyPart, entry)
  }
  return [...out.values()].sort((a, b) => b.sets - a.sets || b.previous - a.previous)
}
