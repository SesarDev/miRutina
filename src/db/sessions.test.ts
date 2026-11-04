import 'fake-indexeddb/auto'
import { todayKey } from '@/lib/dates'
import { newItem } from '@/lib/routines'
import { planWorkout } from './planning'
import { createRoutine } from './routines'
import { db } from './schema'
import {
  addExerciseToSession,
  closeStaleSessions,
  addSet,
  addWarmup,
  completeSet,
  discardSession,
  finishEditing,
  moveSessionDate,
  findOpenSession,
  finishSession,
  moveSessionItem,
  removeSet,
  setFeel,
  setSetValue,
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

  it('cambiar el peso copia el valor a las series pendientes, no a las hechas', async () => {
    const s = await startSession({ routineId: (await routine()).id })
    const rows = await rowsOf(s.id, 'press')
    await setSetValue(rows[0]!.id, { weight: 60 })
    await completeSet(rows[0]!.id)
    await setSetValue(rows[1]!.id, { weight: 65 })
    expect((await rowsOf(s.id, 'press')).map((r) => r.weight)).toEqual([60, 65, 65])
    await setSetValue(rows[1]!.id, { reps: 8 })
    expect((await rowsOf(s.id, 'press')).map((r) => r.reps)).toEqual([null, 8, 8])
  })

  it('quitar una serie se puede deshacer', async () => {
    const s = await startSession({ routineId: (await routine()).id })
    const rows = await rowsOf(s.id, 'press')
    for (const [i, r] of rows.entries()) await updateSetRow(r.id, { reps: 10 - i })
    const undo = await removeSet(rows[1]!.id)
    expect((await rowsOf(s.id, 'press')).map((r) => r.reps)).toEqual([10, 8])
    await undo!()
    expect((await rowsOf(s.id, 'press')).map((r) => [r.order, r.reps])).toEqual([
      [0, 10],
      [1, 9],
      [2, 8],
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

describe('terminar', () => {
  it('cierra la sesión, descarta las series sin hacer y marca hecho el entreno del día', async () => {
    const r = await routine()
    const [planned] = await planWorkout(todayKey(), r.id)
    const s = await startSession({ plannedId: planned!.id })
    const [first] = await rowsOf(s.id, 'press')
    await updateSetRow(first!.id, { weight: 60, reps: 10 })
    await completeSet(first!.id)

    const ended = await finishSession(s.id)
    expect(ended?.endedAt).not.toBeNull()
    expect((await rowsOf(s.id)).map((x) => x.id)).toEqual([first!.id])
    expect(await db.plannedWorkouts.get(planned!.id)).toMatchObject({
      status: 'done',
      sessionId: s.id,
    })
    expect(await findOpenSession()).toBeUndefined()
  })

  it('una sesión empezada sin el planificado también lo marca si es la misma rutina', async () => {
    const r = await routine()
    const [planned] = await planWorkout(todayKey(), r.id)
    const s = await startSession({ routineId: r.id })
    await finishSession(s.id)
    expect(await db.plannedWorkouts.get(planned!.id)).toMatchObject({
      status: 'done',
      sessionId: s.id,
    })
  })

  it('sesión libre sin planificación', async () => {
    const s = await startSession()
    await addExerciseToSession(s.id, 'curl')
    const ended = await finishSession(s.id)
    expect(ended?.endedAt).not.toBeNull()
  })
})

describe('sesiones abiertas de otro día', () => {
  /** A session left open on an earlier day (e.g. «Empezar» tried in F2, never finished). */
  async function staleSession(routineId: string, date: string) {
    const [planned] = await planWorkout(date, routineId)
    const s = await startSession({ plannedId: planned!.id })
    await db.sessions.update(s.id, { date, startedAt: `${date}T10:00:00.000Z` })
    return { planned: planned!, session: s }
  }

  it('Empezar el entreno de hoy no reutiliza una sesión abierta de otro día', async () => {
    const r = await routine()
    const old = await staleSession(r.id, '2026-10-01')
    // The same planned row moved to today (or a weekly repeat linked by mistake).
    await db.plannedWorkouts.update(old.planned.id, { date: todayKey() })
    const s = await startSession({ plannedId: old.planned.id })
    expect(s.id).not.toBe(old.session.id)
    expect(s.date).toBe(todayKey())
  })

  it('al abrir la app se cierran: con series se terminan en su día, vacías se borran', async () => {
    const r = await routine()
    const withSets = await staleSession(r.id, '2026-10-01')
    const [row] = await rowsOf(withSets.session.id, 'press')
    await updateSetRow(row!.id, { weight: 60, reps: 10 })
    await completeSet(row!.id)
    const empty = await staleSession(r.id, '2026-10-02')
    const today = await startSession({ routineId: r.id })

    await closeStaleSessions()

    expect((await db.sessions.get(withSets.session.id))?.endedAt).not.toBeNull()
    expect((await db.plannedWorkouts.get(withSets.planned.id))?.status).toBe('done')
    expect((await db.sessions.get(empty.session.id))?.deletedAt).not.toBeNull()
    expect(await db.plannedWorkouts.get(empty.planned.id)).toMatchObject({
      status: 'planned',
      sessionId: null,
    })
    expect((await findOpenSession())?.id).toBe(today.id)
  })
})

describe('descartar una sesión', () => {
  it('borra la sesión y sus series, el entreno vuelve a planificado, y se puede deshacer', async () => {
    const r = await routine()
    const [planned] = await planWorkout(todayKey(), r.id)
    const s = await startSession({ plannedId: planned!.id })
    const [first] = await rowsOf(s.id, 'press')
    await updateSetRow(first!.id, { weight: 60, reps: 10 })
    await completeSet(first!.id)

    const undo = await discardSession(s.id)
    expect((await db.sessions.get(s.id))?.deletedAt).not.toBeNull()
    expect(await rowsOf(s.id)).toEqual([])
    expect(await db.plannedWorkouts.get(planned!.id)).toMatchObject({
      status: 'planned',
      sessionId: null,
    })
    expect(await findOpenSession()).toBeUndefined()

    // A new start from the same plan creates a fresh session.
    const again = await startSession({ plannedId: planned!.id })
    expect(again.id).not.toBe(s.id)
    await discardSession(again.id)

    await undo()
    expect((await db.sessions.get(s.id))?.deletedAt).toBeNull()
    expect(await rowsOf(s.id)).toHaveLength(5)
    expect((await db.plannedWorkouts.get(planned!.id))?.sessionId).toBe(s.id)
  })

  it('una sesión terminada vuelve a dejar el entreno sin hacer', async () => {
    const r = await routine()
    const [planned] = await planWorkout(todayKey(), r.id)
    const s = await startSession({ plannedId: planned!.id })
    await finishSession(s.id)
    expect((await db.plannedWorkouts.get(planned!.id))?.status).toBe('done')
    await discardSession(s.id)
    expect((await db.plannedWorkouts.get(planned!.id))?.status).toBe('planned')
  })
})

describe('editar sesiones pasadas', () => {
  it('cambiar de día: el planificado original vuelve a pendiente y se enlaza el del nuevo día', async () => {
    const r = await routine()
    const [wrong] = await planWorkout('2026-10-29', r.id)
    const [right] = await planWorkout('2026-10-31', r.id)
    const s = await startSession({ plannedId: wrong!.id })
    await finishSession(s.id)
    await db.sessions.update(s.id, { date: '2026-10-29' })

    await moveSessionDate(s.id, '2026-10-31')
    expect((await db.sessions.get(s.id))?.date).toBe('2026-10-31')
    expect(await db.plannedWorkouts.get(wrong!.id)).toMatchObject({
      status: 'planned',
      sessionId: null,
    })
    expect(await db.plannedWorkouts.get(right!.id)).toMatchObject({
      status: 'done',
      sessionId: s.id,
    })
  })

  it('al terminar de editar se descartan las filas añadidas sin marcar', async () => {
    const r = await routine()
    const s = await startSession({ routineId: r.id })
    const [first] = await rowsOf(s.id, 'press')
    await updateSetRow(first!.id, { weight: 60, reps: 10 })
    await completeSet(first!.id)
    await finishSession(s.id)
    await addSet(s.id, 'press')
    expect(await rowsOf(s.id)).toHaveLength(2)
    await finishEditing(s.id)
    expect(await rowsOf(s.id)).toHaveLength(1)
  })
})
