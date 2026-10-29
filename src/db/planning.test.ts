import 'fake-indexeddb/auto'
import {
  moveWorkout,
  planWorkout,
  removeWorkout,
  restoreWorkout,
  setWorkoutStatus,
} from './planning'
import { db } from './schema'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('planificación', () => {
  it('planifica lunes Torso, miércoles Pierna y viernes Torso durante 4 semanas', async () => {
    await planWorkout('2026-11-02', 'torso', 4)
    await planWorkout('2026-11-04', 'pierna', 4)
    await planWorkout('2026-11-06', 'torso', 4)
    const all = await db.plannedWorkouts.orderBy('date').toArray()
    expect(all).toHaveLength(12)
    expect(all.filter((p) => p.routineId === 'torso').map((p) => p.date)).toEqual([
      '2026-11-02',
      '2026-11-06',
      '2026-11-09',
      '2026-11-13',
      '2026-11-16',
      '2026-11-20',
      '2026-11-23',
      '2026-11-27',
    ])
    expect(all.every((p) => p.status === 'planned' && p.sessionId === null)).toBe(true)
    // Each row queues for sync.
    expect(await db.outbox.count()).toBe(12)
  })

  it('mueve un entreno de día y lo marca como saltado', async () => {
    const [w] = await planWorkout('2026-11-02', 'torso')
    await moveWorkout(w!.id, '2026-11-03')
    await setWorkoutStatus(w!.id, 'skipped')
    expect(await db.plannedWorkouts.get(w!.id)).toMatchObject({
      date: '2026-11-03',
      status: 'skipped',
    })
  })

  it('quitar es un borrado lógico que se puede deshacer', async () => {
    const [w] = await planWorkout('2026-11-02', 'torso')
    await removeWorkout(w!.id)
    expect((await db.plannedWorkouts.get(w!.id))?.deletedAt).not.toBeNull()
    await restoreWorkout(w!.id)
    expect((await db.plannedWorkouts.get(w!.id))?.deletedAt).toBeNull()
  })

  it('limita la repetición a 12 semanas', async () => {
    expect(await planWorkout('2026-11-02', 'torso', 40)).toHaveLength(12)
  })
})
