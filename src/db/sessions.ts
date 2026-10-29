/** Workout sessions. F2 only starts them; logging sets arrives in F3. */
import { uuid } from '@/lib/uuid'
import { todayKey } from '@/lib/dates'
import { nowIso, save } from './repo'
import { db } from './schema'
import type { Session } from './types'

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

  const session = await save('sessions', {
    id: uuid(),
    date: todayKey(),
    routineId: options.routineId ?? planned?.routineId ?? null,
    startedAt: nowIso(),
    endedAt: null,
    notes: null,
  })
  if (planned) await save('plannedWorkouts', { ...planned, sessionId: session.id })
  return session
}

/** The session started and not finished, if any (Hoy offers «Continuar entreno»). */
export async function findOpenSession(): Promise<Session | undefined> {
  const open = (await db.sessions.toArray()).filter((s) => !s.endedAt && !s.deletedAt)
  return open.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
}
