/**
 * «Última vez» line of an exercise: what was done and how it felt. Never a suggestion.
 * e.g. «Última vez (hace 4 días): 60 kg × 10, 10, 9 · Puedo más».
 */
import { differenceInCalendarDays } from 'date-fns'
import { FEEL_LABELS, type Feel, type SetLog } from '@/db/types'
import { formatDay, fromDateKey, type DateKey } from './dates'
import { formatWeight } from './numbers'

export type PastSet = Pick<
  SetLog,
  'order' | 'dropIndex' | 'weight' | 'reps' | 'durationSec' | 'feel' | 'completedAt'
>

/** Work sets of one past session for one exercise, in order (no warm-ups). */
export type PastSession = {
  sessionId: string
  date: DateKey
  sets: PastSet[]
}

export function sortSets<T extends Pick<SetLog, 'order' | 'dropIndex'>>(sets: T[]): T[] {
  return [...sets].sort((a, b) => a.order - b.order || a.dropIndex - b.dropIndex)
}

/** «hoy», «ayer», «hace 4 días», «hace 3 semanas» or «el 3 de marzo». */
export function relativeDay(date: DateKey, today: DateKey): string {
  const days = differenceInCalendarDays(fromDateKey(today), fromDateKey(date))
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 14) return `hace ${days} días`
  if (days < 60) return `hace ${Math.round(days / 7)} semanas`
  return formatDay(date, "'el' d 'de' MMMM")
}

function repsText(set: PastSet): string {
  if (set.reps !== null) return String(set.reps)
  if (set.durationSec !== null) return `${set.durationSec} s`
  return '—'
}

function setText(set: PastSet, withWeight: boolean): string {
  if (set.weight === null) return repsText(set)
  return withWeight ? `${formatWeight(set.weight)} kg × ${repsText(set)}` : repsText(set)
}

/**
 * «60 kg × 10, 10, 9». Consecutive straight sets with the same weight share it; a weight
 * change starts a new group («· 62,5 kg × 8») and drops chain with «→».
 */
export function summarizeSets(sets: PastSet[]): string {
  const chains: PastSet[][] = []
  for (const set of sortSets(sets)) {
    const last = chains.at(-1)
    if (set.dropIndex > 0 && last) last.push(set)
    else chains.push([set])
  }

  const groups: string[] = []
  let weight: number | null | undefined
  let current: string[] = []
  const flush = () => {
    if (current.length) groups.push(current.join(', '))
    current = []
  }

  for (const chain of chains) {
    const [main, ...drops] = chain as [PastSet, ...PastSet[]]
    if (drops.length) {
      flush()
      weight = undefined
      groups.push(chain.map((s) => setText(s, true)).join(' → '))
      continue
    }
    if (main.weight !== weight || current.length === 0) {
      flush()
      weight = main.weight
      current.push(setText(main, true))
    } else {
      current.push(setText(main, false))
    }
  }
  flush()

  const text = groups.join(' · ')
  return sets.every((s) => s.weight === null && s.reps !== null) ? `${text} reps` : text
}

/** The feel of the last set; if it has none, the most frequent one (latest wins a tie). */
export function summaryFeel(sets: PastSet[]): Feel | null {
  const sorted = sortSets(sets)
  const last = sorted.at(-1)
  if (last?.feel) return last.feel

  const counts = new Map<Feel, number>()
  let best: Feel | null = null
  for (const { feel } of sorted) {
    if (!feel) continue
    const n = (counts.get(feel) ?? 0) + 1
    counts.set(feel, n)
    if (best === null || n >= (counts.get(best) ?? 0)) best = feel
  }
  return best
}

export function formatLastTime(session: PastSession, today: DateKey, label = 'Última vez'): string {
  const feel = summaryFeel(session.sets)
  const head = `${label} (${relativeDay(session.date, today)}): ${summarizeSets(session.sets)}`
  return feel ? `${head} · ${FEEL_LABELS[feel]}` : head
}
