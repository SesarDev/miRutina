import 'fake-indexeddb/auto'
import { todayKey } from '@/lib/dates'
import { planWorkout } from './planning'
import { db } from './schema'
import { findOpenSession, startSession } from './sessions'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('sesiones', () => {
  it('empieza una sesión desde un entreno planificado y lo enlaza', async () => {
    const [planned] = await planWorkout(todayKey(), 'torso')
    const session = await startSession({ plannedId: planned!.id })
    expect(session).toMatchObject({ date: todayKey(), routineId: 'torso', endedAt: null })
    expect((await db.plannedWorkouts.get(planned!.id))?.sessionId).toBe(session.id)
  })

  it('no duplica la sesión si se pulsa Empezar dos veces', async () => {
    const [planned] = await planWorkout(todayKey(), 'torso')
    const a = await startSession({ plannedId: planned!.id })
    const b = await startSession({ plannedId: planned!.id })
    expect(b.id).toBe(a.id)
    expect(await db.sessions.count()).toBe(1)
  })

  it('sesión libre sin rutina, y encuentra la sesión abierta', async () => {
    const s = await startSession()
    expect(s.routineId).toBeNull()
    expect((await findOpenSession())?.id).toBe(s.id)
  })
})
