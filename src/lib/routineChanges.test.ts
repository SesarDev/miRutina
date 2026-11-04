import type { SessionItem } from '@/db/types'
import { newItem } from './routines'
import { routineChanges } from './routineChanges'

const routine = [
  { ...newItem('press', 0, 'i1'), sets: 3 },
  { ...newItem('remo', 1, 'i2'), sets: 3 },
]
const session = (items = routine): SessionItem[] =>
  items.map((i) => ({ ...i, skipped: false, note: null }))
const done = (
  exerciseId: string,
  n: number,
  extra: Partial<{ dropIndex: number; isWarmup: boolean }> = {},
) =>
  Array.from({ length: n }, (_, order) => ({
    exerciseId,
    order,
    dropIndex: 0,
    isWarmup: false,
    completedAt: '2026-11-04T10:00:00Z',
    ...extra,
  }))

describe('routineChanges', () => {
  it('sin cambios si se hizo lo previsto', () => {
    const r = routineChanges(routine, session(), [...done('press', 3), ...done('remo', 3)])
    expect(r.changes).toEqual([])
  })

  it('menos series por cansancio también es un cambio (el usuario decide)', () => {
    const r = routineChanges(routine, session(), [...done('press', 3), ...done('remo', 2)])
    expect(r.changes).toEqual([{ kind: 'sets', exerciseId: 'remo', from: 3, to: 2 }])
    expect(r.items.find((i) => i.exerciseId === 'remo')?.sets).toBe(2)
  })

  it('ejercicio añadido y nuevo orden', () => {
    const items = session([routine[1]!, routine[0]!, { ...newItem('curl', 2, 'i3'), sets: 2 }])
    const r = routineChanges(routine, items, [
      ...done('press', 3),
      ...done('remo', 3),
      ...done('curl', 2),
    ])
    expect(r.changes).toEqual([{ kind: 'added', exerciseId: 'curl' }, { kind: 'order' }])
    expect(r.items.map((i) => [i.exerciseId, i.order])).toEqual([
      ['remo', 0],
      ['press', 1],
      ['curl', 2],
    ])
    expect(r.items[2]).not.toHaveProperty('skipped')
  })

  it('un ejercicio saltado no cuenta como quitado ni cambia sus series', () => {
    const items = session().map((i) => (i.exerciseId === 'remo' ? { ...i, skipped: true } : i))
    expect(routineChanges(routine, items, done('press', 3)).changes).toEqual([])
  })

  it('calentamientos y bajadas no son series nuevas', () => {
    const rows = [
      ...done('press', 3),
      ...done('press', 2, { isWarmup: true }),
      ...done('press', 3, { dropIndex: 1 }),
      ...done('remo', 3),
    ]
    expect(routineChanges(routine, session(), rows).changes).toEqual([])
  })
})
