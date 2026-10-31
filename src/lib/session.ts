/**
 * Pure logic of the session in progress: rows copied from the last time, performance order
 * (supersets alternate, drops chain), rest after each set and progress. Nothing here ever
 * computes a weight: values only come from what was logged before.
 */
import type { RoutineItem, SessionItem, SetLog } from '@/db/types'
import { sortSets, type PastSession, type PastSet } from './lastTime'

export type RowDraft = Pick<SetLog, 'order' | 'dropIndex' | 'weight' | 'reps' | 'isWarmup'>

type RowLike = Pick<SetLog, 'id' | 'order' | 'dropIndex' | 'isWarmup' | 'completedAt'>

/** Rest after a warm-up set (they carry no feel and do not count). */
export const WARMUP_REST_SEC = 60

/** Wait for a feel before the rest starts on its own (agreed in F3: 5 s, time to rack the bar). */
export const FEEL_TIMEOUT_MS = 5000

export function dropsOf(item: Pick<RoutineItem, 'technique' | 'drops'>): number {
  return item.technique === 'descendente' ? (item.drops ?? 0) : 0
}

/** Groups sets into chains: a set followed by its drops. */
export function chainsOf<T extends Pick<SetLog, 'order' | 'dropIndex'>>(sets: T[]): T[][] {
  const chains = new Map<number, T[]>()
  for (const set of sortSets(sets)) {
    const chain = chains.get(set.order)
    if (chain) chain.push(set)
    else chains.set(set.order, [set])
  }
  return [...chains.values()]
}

/**
 * Value of set `index` (drop `dropIndex`) last time: the same set if it exists, otherwise the
 * last one available. Drops only copy drops.
 */
function lastValue(last: PastSession | undefined, index: number, dropIndex: number) {
  if (!last) return undefined
  const chains = chainsOf(last.sets)
  const pick = (chain: PastSet[] | undefined) => chain?.find((s) => s.dropIndex === dropIndex)
  return pick(chains[index]) ?? pick(chains.at(-1))
}

/** Rows of an exercise when the session starts, pre-filled with the last time's values. */
export function plannedRows(item: RoutineItem, last?: PastSession): RowDraft[] {
  const rows: RowDraft[] = []
  for (let order = 0; order < item.sets; order++) {
    for (let dropIndex = 0; dropIndex <= dropsOf(item); dropIndex++) {
      const prev = lastValue(last, order, dropIndex)
      rows.push({
        order,
        dropIndex,
        weight: prev?.weight ?? null,
        reps: prev?.reps ?? null,
        isWarmup: false,
      })
    }
  }
  return rows
}

/** One more set at the end: copies the values of the last set of the exercise. */
export function extraRow(rows: (RowDraft & { order: number })[]): RowDraft {
  const sorted = sortSets(rows)
  const last = sorted.filter((r) => r.dropIndex === 0).at(-1)
  return {
    order: (sorted.at(-1)?.order ?? -1) + 1,
    dropIndex: 0,
    weight: last?.weight ?? null,
    reps: last?.reps ?? null,
    isWarmup: false,
  }
}

/** Target reps shown when a row has none: «12» (ascendentes), «8–12», «10». */
export function targetReps(item: RoutineItem, workIndex: number, dropIndex: number): string {
  if (dropIndex > 0) return 'fallo'
  const perSet = item.technique === 'ascendente' ? item.repsPerSet?.[workIndex] : undefined
  if (perSet) return String(perSet)
  return item.repMin === item.repMax ? String(item.repMin) : `${item.repMin}–${item.repMax}`
}

/** Index of a row's set among the work sets of its exercise (warm-ups excluded). */
export function workIndexOf(row: Pick<SetLog, 'order'>, rows: RowLike[]): number {
  const work = new Set(rows.filter((r) => !r.isWarmup).map((r) => r.order))
  return [...work].sort((a, b) => a - b).indexOf(row.order)
}

/** Consecutive items with the same groupId form one block (a superset); others are alone. */
export function blocksOf<T extends Pick<RoutineItem, 'id' | 'groupId'>>(items: T[]): T[][] {
  const blocks: T[][] = []
  for (const item of items) {
    const last = blocks.at(-1)
    if (item.groupId && last?.[0]?.groupId === item.groupId) last.push(item)
    else blocks.push([item])
  }
  return blocks
}

export type SequenceStep<R extends RowLike> = {
  row: R
  itemId: string
  /** Id of the block (the superset's groupId or the item's id). */
  blockId: string
  /** Chain index within its exercise: in a superset, the round. */
  round: number
}

/**
 * Every row of the session in the order it is performed. Supersets alternate their exercises
 * round by round; drops follow their set. Skipped exercises are left out.
 */
export function sequence<R extends RowLike & Pick<SetLog, 'exerciseId'>>(
  items: SessionItem[],
  rows: R[],
): SequenceStep<R>[] {
  const out: SequenceStep<R>[] = []
  for (const block of blocksOf(items.filter((i) => !i.skipped))) {
    const blockId = block[0]!.groupId ?? block[0]!.id
    const chains = block.map((item) =>
      chainsOf(rows.filter((r) => r.exerciseId === item.exerciseId)),
    )
    const rounds = Math.max(0, ...chains.map((c) => c.length))
    for (let round = 0; round < rounds; round++) {
      block.forEach((item, i) => {
        for (const row of chains[i]![round] ?? [])
          out.push({ row, itemId: item.id, blockId, round })
      })
    }
  }
  return out
}

/** The first row not done yet, in performance order. */
export function nextRow<R extends RowLike & Pick<SetLog, 'exerciseId'>>(
  items: SessionItem[],
  rows: R[],
): SequenceStep<R> | undefined {
  return sequence(items, rows).find((s) => !s.row.completedAt)
}

/**
 * The set that follows `rowId` once it is done: the next pending one after it in performance
 * order (in a superset, the partner exercise), wrapping round to earlier pending sets.
 */
export function nextAfter<R extends RowLike & Pick<SetLog, 'exerciseId'>>(
  items: SessionItem[],
  rows: R[],
  rowId: string,
): SequenceStep<R> | undefined {
  const steps = sequence(items, rows)
  const i = steps.findIndex((s) => s.row.id === rowId)
  const pending = (s: SequenceStep<R>) => !s.row.completedAt && s.row.id !== rowId
  return steps.slice(i + 1).find(pending) ?? steps.slice(0, Math.max(0, i)).find(pending)
}

/**
 * Seconds of rest after completing `rowId`: none inside a drop chain or between the exercises
 * of a superset round; otherwise the rest of the exercise (of the block's last exercise for a
 * superset). Warm-ups get a short fixed rest.
 */
export function restAfter<R extends RowLike & Pick<SetLog, 'exerciseId'>>(
  items: SessionItem[],
  rows: R[],
  rowId: string,
): number {
  const steps = sequence(items, rows)
  const i = steps.findIndex((s) => s.row.id === rowId)
  const step = steps[i]
  if (!step) return 0
  const next = steps[i + 1]
  if (next && next.blockId === step.blockId && next.round === step.round) return 0
  if (step.row.isWarmup) return WARMUP_REST_SEC
  const block = items.filter((it) => (it.groupId ?? it.id) === step.blockId)
  return block.at(-1)?.restSec ?? 0
}

/** «2/3»: work sets done out of planned (a drop set counts once, when its set is done). */
export function progressOf(rows: RowLike[]): { done: number; total: number } {
  const work = chainsOf(rows.filter((r) => !r.isWarmup))
  return { done: work.filter((c) => c[0]?.completedAt).length, total: work.length }
}

/** Default step of the +/− weight buttons by equipment (agreed in F3; a button step, not advice). */
export function defaultWeightStep(equipment: string): number {
  switch (equipment) {
    case 'barbell':
    case 'olympic barbell':
    case 'ez barbell':
    case 'trap bar':
    case 'smith machine':
      return 2.5
    case 'dumbbell':
    case 'kettlebell':
      return 2
    case 'leverage machine':
    case 'sled machine':
    case 'cable':
      return 5
    default:
      return 1
  }
}

export type SessionSummary = {
  durationMin: number
  exercises: number
  sets: number
  /** kg × reps of completed work sets. */
  volume: number
}

export function summarize(
  session: { startedAt: string; endedAt: string | null },
  rows: Pick<SetLog, 'exerciseId' | 'weight' | 'reps' | 'isWarmup' | 'completedAt'>[],
  now = new Date(),
): SessionSummary {
  const done = rows.filter((r) => r.completedAt && !r.isWarmup)
  const end = session.endedAt ? new Date(session.endedAt) : now
  return {
    durationMin: Math.max(0, Math.round((end.getTime() - Date.parse(session.startedAt)) / 60000)),
    exercises: new Set(done.map((r) => r.exerciseId)).size,
    sets: done.length,
    volume: Math.round(done.reduce((sum, r) => sum + (r.weight ?? 0) * (r.reps ?? 0), 0)),
  }
}
