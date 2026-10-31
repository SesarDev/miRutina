import 'fake-indexeddb/auto'
import { todayKey } from '@/lib/dates'
import { newItem } from '@/lib/routines'
import { planWorkout } from './planning'
import { createRoutine } from './routines'
import { db } from './schema'
import {
  addExerciseToSession,
  addSet,
  addWarmup,
  completeSet,
  findOpenSession,
  moveSessionItem,
  removeSet,
  setFeel,
  startSession,
  uncompleteSet,
  updateSetRow,
} from './sessions'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const rowsOf = async (sessionId: string, exerciseId?: string) =>
  (await db.setLogs.where('sessionId').equals(sessionId).toArray())
    .filter((r) => !r.deletedAt && (!exerciseId || r.exerciseId === exerciseId))
    .sort((a, b) => a.order - b.order || a.dropIndex - b.dropIndex)

async function routine() {
  return createRoutine('Torso', [
    { ...newItem('press', 0, 'i1'), sets: 3 },
    { ...newItem('remo', 1, 'i2'), sets: 2 },
  ])
}

describe('sesiones', () => {
  it('empieza una sesión desde un entreno planificado y lo enlaza', async () => {
    const r = await routine()
    const [planned] = await planWorkout(todayKey(), r.id)
    const session = await startSession({ plannedId: planned!.id })
    expect(session).toMatchObject({ date: todayKey(), routineId: r.id, endedAt: null })
    expect(session.items.map((i) => i.exerciseId)).toEqual(['press', 'remo'])
    expect((await db.plannedWorkouts.get(planned!.id))?.sessionId).toBe(session.id)
  })

  it('no duplica la sesión si se pulsa Empezar dos veces', async () => {
    const r = await routine()
    const [planned] = await planWorkout(todayKey(), r.id)
    const a = await startSession({ plannedId: planned!.id })
    const b = await startSession({ plannedId: planned!.id })
    expect(b.id).toBe(a.id)
    expect(await db.sessions.count()).toBe(1)
  })

  it('sesión libre sin rutina, y encuentra la sesión abierta', async () => {
    const s = await startSession()
    expect(s.routineId).toBeNull()
    expect(s.items).toEqual([])
    expect((await findOpenSession())?.id).toBe(s.id)
  })

  it('crea las filas precargadas con la última vez de cada ejercicio', async () => {
    const r = await routine()
    const first = await startSession({ routineId: r.id })
    const rows = await rowsOf(first.id, 'press')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ weight: null, reps: null, completedAt: null })

    for (const [i, row] of rows.entries()) {
      await updateSetRow(row.id, { weight: 60, reps: 10 - i })
      await completeSet(row.id)
    }
    await db.sessions.update(first.id, { endedAt: new Date().toISOString() })

    const second = await startSession({ routineId: r.id })
    const prefilled = await rowsOf(second.id, 'press')
    expect(prefilled.map((x) => [x.weight, x.reps])).toEqual([
      [60, 10],
      [60, 9],
      [60, 8],
    ])
  })
})

describe('series', () => {
  it('marcar, valorar y desmarcar (la valoración se va con ella)', async () => {
    const s = await startSession({ routineId: (await routine()).id })
    const [row] = await rowsOf(s.id, 'press')
    await completeSet(row!.id)
    await setFeel(row!.id, 'bien')
    expect(await db.setLogs.get(row!.id)).toMatchObject({ feel: 'bien' })
    expect((await db.setLogs.get(row!.id))?.completedAt).not.toBeNull()
    await uncompleteSet(row!.id)
    expect(await db.setLogs.get(row!.id)).toMatchObject({ feel: null, completedAt: null })
  })

  it('añadir serie copia la última; quitar renumera', async () => {
    const s = await startSession({ routineId: (await routine()).id })
    const rows = await rowsOf(s.id, 'remo')
    await updateSetRow(rows[1]!.id, { weight: 40, reps: 12 })
    const extra = await addSet(s.id, 'remo')
    expect(extra).toMatchObject({ order: 2, weight: 40, reps: 12 })

    await removeSet(rows[0]!.id)
    expect((await rowsOf(s.id, 'remo')).map((r) => [r.order, r.weight])).toEqual([
      [0, 40],
      [1, 40],
    ])
  })

  it('el calentamiento va primero, vacío, y no cuenta para la última vez', async () => {
    const r = await routine()
    const s = await startSession({ routineId: r.id })
    const warm = await addWarmup(s.id, 'remo')
    const rows = await rowsOf(s.id, 'remo')
    expect(rows[0]).toMatchObject({ id: warm.id, isWarmup: true, weight: null })
    expect(rows.map((x) => x.order)).toEqual([0, 1, 2])

    await updateSetRow(warm.id, { weight: 20, reps: 15 })
    await completeSet(warm.id)
    await updateSetRow(rows[1]!.id, { weight: 50, reps: 10 })
    await completeSet(rows[1]!.id)
    await db.sessions.update(s.id, { endedAt: new Date().toISOString() })

    const next = await startSession({ routineId: r.id })
    expect((await rowsOf(next.id, 'remo'))[0]).toMatchObject({ weight: 50, reps: 10 })
  })
})

describe('ejercicios de la sesión', () => {
  it('añade un ejercicio no planificado con sus filas, sin duplicarlo', async () => {
    const s = await startSession()
    await addExerciseToSession(s.id, 'curl', 60)
    await addExerciseToSession(s.id, 'curl', 60)
    const session = await db.sessions.get(s.id)
    expect(session?.items).toHaveLength(1)
    expect(session?.items[0]).toMatchObject({ exerciseId: 'curl', restSec: 60, skipped: false })
    expect(await rowsOf(s.id, 'curl')).toHaveLength(3)
  })

  it('reordena y mueve una superserie entera', async () => {
    const r = await createRoutine('Mixta', [
      { ...newItem('a', 0, 'a') },
      { ...newItem('b', 1, 'b'), technique: 'superserie', groupId: 'g' },
      { ...newItem('c', 2, 'c'), technique: 'superserie', groupId: 'g' },
    ])
    const s = await startSession({ routineId: r.id })
    await moveSessionItem(s.id, 'c', -1)
    expect((await db.sessions.get(s.id))?.items.map((i) => i.id)).toEqual(['b', 'c', 'a'])
    await moveSessionItem(s.id, 'a', -1)
    expect((await db.sessions.get(s.id))?.items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })
})
