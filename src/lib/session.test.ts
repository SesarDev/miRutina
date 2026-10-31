import type { SessionItem, SetLog } from '@/db/types'
import type { PastSession } from './lastTime'
import { newItem } from './routines'
import {
  defaultWeightStep,
  extraRow,
  nextAfter,
  nextRow,
  plannedRows,
  progressOf,
  restAfter,
  sequence,
  summarize,
  targetReps,
  WARMUP_REST_SEC,
} from './session'

const item = (exerciseId: string, patch: Partial<SessionItem> = {}): SessionItem => ({
  ...newItem(exerciseId, 0, `item-${exerciseId}`),
  skipped: false,
  note: null,
  ...patch,
})

const past = (sets: [number, number, number | null, number | null][]): PastSession => ({
  sessionId: 'old',
  date: '2026-10-25',
  sets: sets.map(([order, dropIndex, weight, reps]) => ({
    order,
    dropIndex,
    weight,
    reps,
    durationSec: null,
    feel: null,
    completedAt: 'x',
  })),
})

let n = 0
type Row = Pick<SetLog, 'id' | 'exerciseId' | 'order' | 'dropIndex' | 'isWarmup' | 'completedAt'>
const rowsFor = (it: SessionItem, done = 0): Row[] =>
  plannedRows(it).map((d, i) => ({
    id: `r${n++}`,
    exerciseId: it.exerciseId,
    order: d.order,
    dropIndex: d.dropIndex,
    isWarmup: false,
    completedAt: i < done ? 'x' : null,
  }))

describe('plannedRows', () => {
  it('copia peso y reps de la misma serie de la última vez', () => {
    const rows = plannedRows(
      item('a'),
      past([
        [0, 0, 60, 10],
        [1, 0, 60, 9],
        [2, 0, 62.5, 8],
      ]),
    )
    expect(rows.map((r) => [r.weight, r.reps])).toEqual([
      [60, 10],
      [60, 9],
      [62.5, 8],
    ])
  })

  it('si la serie no existía, usa la última disponible', () => {
    const rows = plannedRows(
      item('a', { sets: 4 }),
      past([
        [0, 0, 60, 10],
        [1, 0, 65, 8],
      ]),
    )
    expect(rows.map((r) => r.weight)).toEqual([60, 65, 65, 65])
  })

  it('sin historial, vacías', () => {
    expect(plannedRows(item('a')).every((r) => r.weight === null && r.reps === null)).toBe(true)
  })

  it('descendentes: cada serie con sus bajadas; las bajadas solo copian bajadas', () => {
    const it = item('a', { technique: 'descendente', sets: 2, drops: 2 })
    const rows = plannedRows(
      it,
      past([
        [0, 0, 60, 10],
        [0, 1, 50, 6],
      ]),
    )
    expect(rows.map((r) => [r.order, r.dropIndex, r.weight])).toEqual([
      [0, 0, 60],
      [0, 1, 50],
      [0, 2, null],
      [1, 0, 60],
      [1, 1, 50],
      [1, 2, null],
    ])
  })

  it('alemanas: 10 filas', () => {
    expect(plannedRows(item('a', { technique: 'aleman', sets: 10 }))).toHaveLength(10)
  })
})

describe('extraRow y targetReps', () => {
  it('la serie extra copia la última', () => {
    const rows = plannedRows(
      item('a'),
      past([
        [0, 0, 60, 10],
        [1, 0, 60, 9],
        [2, 0, 57.5, 8],
      ]),
    )
    expect(extraRow(rows)).toMatchObject({ order: 3, weight: 57.5, reps: 8, dropIndex: 0 })
  })

  it('reps objetivo por técnica', () => {
    expect(targetReps(item('a'), 0, 0)).toBe('8–12')
    expect(targetReps(item('a', { technique: 'aleman', repMin: 10, repMax: 10 }), 3, 0)).toBe('10')
    const asc = item('a', { technique: 'ascendente', repsPerSet: [12, 10, 8, 6] })
    expect(targetReps(asc, 2, 0)).toBe('8')
    expect(targetReps(item('a'), 0, 1)).toBe('fallo')
  })
})

describe('sequence, nextRow y restAfter', () => {
  it('ejercicios sueltos en orden; descanso del ejercicio tras cada serie', () => {
    const a = item('a', { sets: 2, restSec: 90 })
    const b = item('b', { sets: 1 })
    const rows = [...rowsFor(a, 1), ...rowsFor(b)]
    expect(sequence([a, b], rows).map((s) => s.row.exerciseId)).toEqual(['a', 'a', 'b'])
    expect(nextRow([a, b], rows)?.row.id).toBe(rows[1]!.id)
    expect(restAfter([a, b], rows, rows[0]!.id)).toBe(90)
  })

  it('superserie: alterna por rondas y descansa al cerrar la ronda', () => {
    const a = item('a', { technique: 'superserie', groupId: 'g', sets: 2, restSec: 75 })
    const b = item('b', { technique: 'superserie', groupId: 'g', sets: 2, restSec: 75 })
    const rows = [...rowsFor(a), ...rowsFor(b)]
    const seq = sequence([a, b], rows)
    expect(seq.map((s) => `${s.row.exerciseId}${s.round}`)).toEqual(['a0', 'b0', 'a1', 'b1'])
    expect(restAfter([a, b], rows, seq[0]!.row.id)).toBe(0)
    expect(restAfter([a, b], rows, seq[1]!.row.id)).toBe(75)
  })

  it('la siguiente tras marcar es la pareja de la superserie, no la primera pendiente', () => {
    const solo = item('s', { sets: 2 })
    const a = item('a', { technique: 'superserie', groupId: 'g', sets: 2 })
    const b = item('b', { technique: 'superserie', groupId: 'g', sets: 2 })
    const rows = [...rowsFor(solo, 1), ...rowsFor(a), ...rowsFor(b)]
    const firstA = rows.find((r) => r.exerciseId === 'a')!
    expect(nextAfter([solo, a, b], rows, firstA.id)?.row.exerciseId).toBe('b')
    const lastB = rows.filter((r) => r.exerciseId === 'b').at(-1)!
    // From the end it wraps round to the pending set of the first exercise.
    expect(nextAfter([solo, a, b], rows, lastB.id)?.row.id).toBe(rows[1]!.id)
  })

  it('descendentes: sin descanso entre bajadas, descanso tras la última', () => {
    const a = item('a', { technique: 'descendente', sets: 1, drops: 2, restSec: 120 })
    const rows = rowsFor(a)
    expect(restAfter([a], rows, rows[0]!.id)).toBe(0)
    expect(restAfter([a], rows, rows[1]!.id)).toBe(0)
    expect(restAfter([a], rows, rows[2]!.id)).toBe(120)
  })

  it('calentamiento: descanso corto fijo; saltados fuera de la secuencia', () => {
    const a = item('a', { sets: 1 })
    const b = item('b', { sets: 1, skipped: true })
    const warm: Row = {
      id: 'w',
      exerciseId: 'a',
      order: -1,
      dropIndex: 0,
      isWarmup: true,
      completedAt: null,
    }
    const rows = [warm, ...rowsFor(a), ...rowsFor(b)]
    expect(sequence([a, b], rows).map((s) => s.row.id)).toEqual(['w', rows[1]!.id])
    expect(restAfter([a, b], rows, 'w')).toBe(WARMUP_REST_SEC)
  })
})

describe('progressOf, defaultWeightStep y summarize', () => {
  it('cuenta series de trabajo; una descendente cuenta una vez', () => {
    const a = item('a', { technique: 'descendente', sets: 2, drops: 1 })
    expect(progressOf(rowsFor(a, 2))).toEqual({ done: 1, total: 2 })
  })

  it('pasos por equipo', () => {
    expect(defaultWeightStep('barbell')).toBe(2.5)
    expect(defaultWeightStep('smith machine')).toBe(2.5)
    expect(defaultWeightStep('dumbbell')).toBe(2)
    expect(defaultWeightStep('cable')).toBe(5)
    expect(defaultWeightStep('body weight')).toBe(1)
  })

  it('resumen: duración, ejercicios, series y volumen sin calentamientos', () => {
    const rows = [
      { exerciseId: 'a', weight: 60, reps: 10, isWarmup: false, completedAt: 'x' },
      { exerciseId: 'a', weight: 20, reps: 10, isWarmup: true, completedAt: 'x' },
      { exerciseId: 'b', weight: 40, reps: 8, isWarmup: false, completedAt: 'x' },
      { exerciseId: 'b', weight: 40, reps: 8, isWarmup: false, completedAt: null },
    ]
    const session = { startedAt: '2026-10-31T10:00:00.000Z', endedAt: '2026-10-31T11:05:00.000Z' }
    expect(summarize(session, rows)).toEqual({
      durationMin: 65,
      exercises: 2,
      sets: 2,
      volume: 920,
    })
  })
})
