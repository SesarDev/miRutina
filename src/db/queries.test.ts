import 'fake-indexeddb/auto'
import {
  exerciseHistory,
  lastSessionsForExercise,
  progressOverview,
  sessionComparison,
  sessionRecords,
} from './queries'
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

describe('exerciseHistory', () => {
  it('todas las sesiones del ejercicio, de más reciente a más antigua, sin borrados', async () => {
    await session('a', '2026-10-01')
    await session('b', '2026-10-05')
    await session('gone', '2026-10-07')
    await log('a', '2026-10-01', 0, { isWarmup: true, weight: 40 })
    await log('a', '2026-10-01', 1)
    await log('b', '2026-10-05', 1, { weight: 62.5 })
    await log('b', '2026-10-05', 0, { weight: 62.5 })
    await log('b', '2026-10-05', 2, { id: 'deleted' })
    await softDelete('setLogs', 'deleted')
    await log('b', '2026-10-05', 3, { completedAt: null })
    await log('gone', '2026-10-07', 0)
    await softDelete('sessions', 'gone')

    const history = await exerciseHistory('press')
    expect(history.map((h) => h.sessionId)).toEqual(['b', 'a'])
    expect(history[0]!.sets.map((s) => s.order)).toEqual([0, 1])
    // Warm-ups stay: lib/progress filters them.
    expect(history[1]!.sets.map((s) => s.isWarmup)).toEqual([true, false])
  })
})

describe('progressOverview', () => {
  it('ejercicios de 90 días con su tendencia, récords de 30 días y días entrenados', async () => {
    await session('old', '2026-06-01') // más de 90 días: solo cuenta como precedente
    await session('a', '2026-09-20')
    await session('b', '2026-10-20')
    await log('old', '2026-06-01', 0, { weight: 50 })
    await log('a', '2026-09-20', 0, { weight: 55 })
    await log('b', '2026-10-20', 0, { weight: 60, feel: 'bien' })
    await log('b', '2026-10-20', 1, { exerciseId: 'dips', weight: null, reps: 12 })

    const { exercises, records, trainedDates } = await progressOverview('2026-10-31')
    expect([...trainedDates].sort()).toEqual(['2026-09-20', '2026-10-20'])
    const press = exercises.find((e) => e.exerciseId === 'press')!
    expect(press.trend).toEqual([
      { date: '2026-09-20', value: 55 },
      { date: '2026-10-20', value: 60 },
    ])
    expect(press).toMatchObject({ lastDate: '2026-10-20', lastFeel: 'bien', trendUnit: 'kg' })
    expect(exercises.find((e) => e.exerciseId === 'dips')).toMatchObject({ trendUnit: 'reps' })
    // El récord del 20 sep queda fuera de los 30 días; el de 20 oct, dentro.
    expect(new Set(records.map((r) => r.date))).toEqual(new Set(['2026-10-20']))
    expect(records.map((r) => r.kind)).toContain('weight')
  })
})

describe('sessionRecords', () => {
  it('los récords de la sesión contra las anteriores, no contra las posteriores', async () => {
    await session('a', '2026-10-01')
    await session('b', '2026-10-05')
    await session('c', '2026-10-09')
    await log('a', '2026-10-01', 0, { weight: 60 })
    await log('b', '2026-10-05', 0, { weight: 62.5 })
    await log('c', '2026-10-09', 0, { weight: 70 })
    expect((await sessionRecords('b')).map((r) => r.kind).sort()).toEqual([
      'e1rm',
      'volume',
      'weight',
    ])
    expect(await sessionRecords('a')).toEqual([])
  })
})

describe('sessionComparison', () => {
  it('cada ejercicio frente a la sesión anterior a esta, no a la más reciente', async () => {
    await session('a', '2026-10-01')
    await session('b', '2026-10-05')
    await session('c', '2026-10-09')
    await log('a', '2026-10-01', 0, { weight: 60 })
    await log('b', '2026-10-05', 0, { weight: 62.5 })
    await log('b', '2026-10-05', 1, { weight: 62.5, reps: 9 })
    await log('c', '2026-10-09', 0, { weight: 65 })

    expect(await sessionComparison('b')).toEqual([
      { exerciseId: 'press', name: 'Ejercicio', now: '62,5 kg × 10, 9', before: '60 kg × 10' },
    ])
    expect((await sessionComparison('a'))[0]?.before).toBeNull()
  })
})
