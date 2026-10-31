import 'fake-indexeddb/auto'
import { lastSessionsForExercise } from './queries'
import { save, softDelete } from './repo'
import { db } from './schema'
import type { SetLog } from './types'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

async function session(id: string, date: string) {
  await save('sessions', {
    id,
    date,
    routineId: null,
    startedAt: `${date}T10:00:00.000Z`,
    endedAt: `${date}T11:00:00.000Z`,
    notes: null,
    items: [],
  })
}

let n = 0
async function log(sessionId: string, date: string, order: number, patch: Partial<SetLog> = {}) {
  await save('setLogs', {
    id: `log-${n++}`,
    sessionId,
    exerciseId: 'press',
    order,
    dropIndex: 0,
    weight: 60,
    reps: 10,
    durationSec: null,
    feel: null,
    isWarmup: false,
    completedAt: `${date}T10:${String(10 + order).padStart(2, '0')}:00.000Z`,
    note: null,
    ...patch,
  })
}

describe('lastSessionsForExercise', () => {
  it('devuelve las dos últimas sesiones, la más reciente primero, con series ordenadas', async () => {
    for (const [id, date] of [
      ['a', '2026-10-01'],
      ['b', '2026-10-08'],
      ['c', '2026-10-15'],
    ] as const) {
      await session(id, date)
      await log(id, date, 1, { reps: 9 })
      await log(id, date, 0)
    }
    const result = await lastSessionsForExercise('press')
    expect(result.map((s) => s.sessionId)).toEqual(['c', 'b'])
    expect(result[0]!.date).toBe('2026-10-15')
    expect(result[0]!.sets.map((s) => s.reps)).toEqual([10, 9])
  })

  it('excluye la sesión actual, calentamientos, series sin hacer y borradas', async () => {
    await session('old', '2026-10-01')
    await log('old', '2026-10-01', 0, { isWarmup: true, weight: 20 })
    await log('old', '2026-10-01', 1, { weight: 60 })
    await log('old', '2026-10-01', 2, { id: 'gone', weight: 99 })
    await softDelete('setLogs', 'gone')
    await log('old', '2026-10-01', 3, { completedAt: null, weight: 70 })

    await session('now', '2026-10-29')
    await log('now', '2026-10-29', 0, { weight: 65 })

    const result = await lastSessionsForExercise('press', { excludeSessionId: 'now' })
    expect(result).toHaveLength(1)
    expect(result[0]!.sets.map((s) => s.weight)).toEqual([60])
  })

  it('sin historial devuelve una lista vacía', async () => {
    expect(await lastSessionsForExercise('press')).toEqual([])
  })
})
