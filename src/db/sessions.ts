/**
 * Workout sessions. Every change is written to Dexie at once: the rows of a session are
 * `setLogs` from the start (without `completedAt` until the set is done), so closing the app
 * never loses a typed weight.
 */
import { todayKey } from '@/lib/dates'
import { extraRow, plannedRows, type RowDraft } from '@/lib/session'
import { newItem, TECHNIQUE_DEFAULTS } from '@/lib/routines'
import { uuid } from '@/lib/uuid'
import { lastSessionsForExercise } from './queries'
import { nowIso, patch, save, saveMany, softDelete } from './repo'
import { db } from './schema'
import type { Feel, RoutineItem, Session, SessionItem, SetLog } from './types'

const toSessionItem = (item: RoutineItem): SessionItem => ({ ...item, skipped: false, note: null })

/** Session items, tolerating rows synced before F3 (no `items`). */
export const itemsOf = (session: Pick<Session, 'items'>): SessionItem[] => session.items ?? []

function rowInput(sessionId: string, exerciseId: string, draft: RowDraft) {
  return {
    id: uuid(),
    sessionId,
    exerciseId,
    ...draft,
    durationSec: null,
    feel: null,
    completedAt: null,
    note: null,
  }
}

/** Creates the rows of an exercise, pre-filled with the values of its last session. */
async function createRows(sessionId: string, item: RoutineItem) {
  const [last] = await lastSessionsForExercise(item.exerciseId, {
    n: 1,
    excludeSessionId: sessionId,
  })
  await saveMany(
    'setLogs',
    plannedRows(item, last).map((d) => rowInput(sessionId, item.exerciseId, d)),
  )
}

/**
 * Starts a session for today, optionally from a routine and a planned workout (which gets
 * linked to it). If that planned workout already has an open session, returns that one.
 */
export async function startSession(
  options: { routineId?: string | null; plannedId?: string } = {},
): Promise<Session> {
  const planned = options.plannedId ? await db.plannedWorkouts.get(options.plannedId) : undefined
  if (planned?.sessionId) {
    const existing = await db.sessions.get(planned.sessionId)
    if (existing && !existing.endedAt && !existing.deletedAt) return existing
  }

  const routineId = options.routineId ?? planned?.routineId ?? null
  const routine = routineId ? await db.routines.get(routineId) : undefined
  // One entry per exercise: the session keys rows by exercise.
  const seen = new Set<string>()
  const items = (routine && !routine.deletedAt ? routine.items : [])
    .filter((item) => !seen.has(item.exerciseId) && seen.add(item.exerciseId))
    .map(toSessionItem)

  const session = await save('sessions', {
    id: uuid(),
    date: todayKey(),
    routineId,
    startedAt: nowIso(),
    endedAt: null,
    notes: null,
    items,
  })
  for (const item of items) await createRows(session.id, item)
  if (planned) await save('plannedWorkouts', { ...planned, sessionId: session.id })
  return session
}

/** The session started and not finished, if any (Hoy offers «Continuar entreno»). */
export async function findOpenSession(): Promise<Session | undefined> {
  const open = (await db.sessions.toArray()).filter((s) => !s.endedAt && !s.deletedAt)
  return open.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
}

async function updateItems(sessionId: string, update: (items: SessionItem[]) => SessionItem[]) {
  const session = await db.sessions.get(sessionId)
  if (!session) return
  const items = update(itemsOf(session)).map((item, order) => ({ ...item, order }))
  await save('sessions', { ...session, items })
}

/** Adds an exercise not in the plan (normal sets, rest from Ajustes). No-op if already there. */
export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string,
  restSec = TECHNIQUE_DEFAULTS.normal.restSec,
) {
  const session = await db.sessions.get(sessionId)
  if (!session || itemsOf(session).some((i) => i.exerciseId === exerciseId)) return
  const item = toSessionItem({ ...newItem(exerciseId, itemsOf(session).length), restSec })
  await updateItems(sessionId, (items) => [...items, item])
  await createRows(sessionId, item)
}

export function setItemSkipped(sessionId: string, itemId: string, skipped: boolean) {
  return updateItems(sessionId, (items) =>
    items.map((i) => (i.id === itemId ? { ...i, skipped } : i)),
  )
}

export function setItemNote(sessionId: string, itemId: string, note: string) {
  return updateItems(sessionId, (items) =>
    items.map((i) => (i.id === itemId ? { ...i, note: note.trim() ? note : null } : i)),
  )
}

/**
 * Moves an exercise one place up or down. A superset moves as a whole and an exercise never
 * lands inside another superset: it jumps over the whole block.
 */
export function moveSessionItem(sessionId: string, itemId: string, direction: -1 | 1) {
  return updateItems(sessionId, (items) => {
    const blockOf = (i: number) => {
      const g = items[i]?.groupId
      let start = i
      let end = i
      if (g) {
        while (items[start - 1]?.groupId === g) start--
        while (items[end + 1]?.groupId === g) end++
      }
      return [start, end] as const
    }
    const index = items.findIndex((i) => i.id === itemId)
    if (index < 0) return items
    const [start, end] = blockOf(index)
    const neighbour = direction < 0 ? start - 1 : end + 1
    if (neighbour < 0 || neighbour >= items.length) return items
    const [nStart, nEnd] = blockOf(neighbour)
    const block = items.slice(start, end + 1)
    const other = items.slice(nStart, nEnd + 1)
    const before = items.slice(0, Math.min(start, nStart))
    const after = items.slice(Math.max(end, nEnd) + 1)
    return direction < 0
      ? [...before, ...block, ...other, ...after]
      : [...before, ...other, ...block, ...after]
  })
}

export function setSessionNotes(sessionId: string, notes: string) {
  return patch('sessions', sessionId, { notes: notes.trim() ? notes : null })
}

/** Rows of one exercise in a session, in order. */
async function rowsOf(sessionId: string, exerciseId: string): Promise<SetLog[]> {
  return (await db.setLogs.where('sessionId').equals(sessionId).toArray())
    .filter((r) => r.exerciseId === exerciseId && !r.deletedAt)
    .sort((a, b) => a.order - b.order || a.dropIndex - b.dropIndex)
}

export function updateSetRow(
  id: string,
  changes: Partial<Pick<SetLog, 'weight' | 'reps' | 'note' | 'isWarmup'>>,
) {
  return patch('setLogs', id, changes)
}

/** Marks a set as done. */
export function completeSet(id: string) {
  return patch('setLogs', id, { completedAt: nowIso() })
}

/** Back to pending: its feel goes with it. */
export function uncompleteSet(id: string) {
  return patch('setLogs', id, { completedAt: null, feel: null })
}

export function setFeel(id: string, feel: Feel | null) {
  return patch('setLogs', id, { feel })
}

/** One more set at the end, with the values of the exercise's last set. */
export async function addSet(sessionId: string, exerciseId: string) {
  const rows = await rowsOf(sessionId, exerciseId)
  const [row] = await saveMany('setLogs', [rowInput(sessionId, exerciseId, extraRow(rows))])
  return row
}

/** A warm-up set before the first one (empty: warm-ups never copy values). */
export async function addWarmup(sessionId: string, exerciseId: string) {
  const rows = await rowsOf(sessionId, exerciseId)
  const renumbered = rows.map((r) => ({ ...r, order: r.order + 1 }))
  const warmup = rowInput(sessionId, exerciseId, {
    order: 0,
    dropIndex: 0,
    weight: null,
    reps: null,
    isWarmup: true,
  })
  await saveMany('setLogs', [warmup, ...renumbered])
  return warmup
}

/** Removes a set (and its drops) and renumbers the rest so «the same set» keeps matching. */
export async function removeSet(id: string) {
  const row = await db.setLogs.get(id)
  if (!row) return
  const rows = await rowsOf(row.sessionId, row.exerciseId)
  const chain = rows.filter((r) => r.order === row.order)
  for (const r of chain) await softDelete('setLogs', r.id)
  const later = rows.filter((r) => r.order > row.order).map((r) => ({ ...r, order: r.order - 1 }))
  await saveMany('setLogs', later)
}

/**
 * Ends a session: unfinished rows are discarded (they never count), and the day's planned
 * workout is marked done and linked (the one started from it, or today's plan of the routine).
 */
export async function finishSession(sessionId: string): Promise<Session | undefined> {
  const session = await db.sessions.get(sessionId)
  if (!session || session.endedAt) return session

  const rows = await db.setLogs.where('sessionId').equals(sessionId).toArray()
  for (const row of rows)
    if (!row.completedAt && !row.deletedAt) await softDelete('setLogs', row.id)

  const planned = (await db.plannedWorkouts.where('date').equals(session.date).toArray()).filter(
    (p) => !p.deletedAt,
  )
  const linked =
    planned.find((p) => p.sessionId === sessionId) ??
    planned.find((p) => p.routineId === session.routineId && p.status === 'planned' && !p.sessionId)
  if (linked) await save('plannedWorkouts', { ...linked, status: 'done', sessionId })

  return save('sessions', { ...session, endedAt: nowIso() })
}
