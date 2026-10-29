import type { RoutineItem } from '@/db/types'
import {
  addExercise,
  applyTechnique,
  estimateMinutes,
  fixGroups,
  linkWithNext,
  moveItem,
  newItem,
  removeItem,
  repsLabel,
  unlink,
  updateGroup,
} from './routines'

const items = (...ids: string[]): RoutineItem[] => ids.map((id, i) => newItem(`ex-${id}`, i, id))
const ids = (list: RoutineItem[]) => list.map((i) => i.id)

describe('routines', () => {
  it('un ejercicio nuevo usa 3 × 8–12 y 120 s', () => {
    expect(newItem('0025', 0)).toMatchObject({
      sets: 3,
      repMin: 8,
      repMax: 12,
      restSec: 120,
      technique: 'normal',
      groupId: null,
    })
  })

  it('aplica los valores por defecto de cada técnica', () => {
    const base = newItem('0025', 0)
    expect(applyTechnique(base, 'aleman')).toMatchObject({
      sets: 10,
      repMin: 10,
      repMax: 10,
      restSec: 90,
    })
    expect(applyTechnique(base, 'descendente')).toMatchObject({ sets: 3, drops: 2 })
    expect(applyTechnique(base, 'ascendente').repsPerSet).toEqual([12, 10, 8, 6])
    expect(applyTechnique(applyTechnique(base, 'descendente'), 'normal')).not.toHaveProperty(
      'drops',
    )
  })

  it('añade, reordena y quita manteniendo order = posición', () => {
    let list = addExercise(items('a', 'b'), 'ex-c')
    expect(list.map((i) => i.order)).toEqual([0, 1, 2])
    list = moveItem(list, 'a', list[2]!.id)
    expect(ids(list).slice(0, 2)).toEqual(['b', list[1]!.id])
    expect(list.at(-1)!.id).toBe('a')
    list = removeItem(list, 'b')
    expect(list.map((i) => i.order)).toEqual([0, 1])
  })

  describe('superseries', () => {
    it('une un ejercicio con el siguiente con 3 rondas y 90 s', () => {
      const list = linkWithNext(items('a', 'b', 'c'), 'a')
      expect(list[0]!.groupId).toBeTruthy()
      expect(list[1]!.groupId).toBe(list[0]!.groupId)
      expect(list[2]!.groupId).toBeNull()
      expect(
        list
          .slice(0, 2)
          .every((i) => i.technique === 'superserie' && i.sets === 3 && i.restSec === 90),
      ).toBe(true)
    })

    it('amplía un grupo existente a un tercer ejercicio', () => {
      let list = linkWithNext(items('a', 'b', 'c'), 'a')
      list = linkWithNext(list, 'b')
      expect(new Set(list.map((i) => i.groupId)).size).toBe(1)
    })

    it('al arrastrar fuera un miembro, el grupo de 1 vuelve a series normales', () => {
      let list = linkWithNext(items('a', 'b', 'c'), 'a')
      list = moveItem(list, 'a', 'c')
      expect(list.every((i) => i.groupId === null && i.technique === 'normal')).toBe(true)
    })

    it('quitar el del medio parte el grupo; quitar uno de dos lo deshace', () => {
      let list = linkWithNext(linkWithNext(items('a', 'b', 'c', 'd'), 'a'), 'b')
      list = linkWithNext(list, 'c')
      list = unlink(list, 'b')
      expect(list[1]!.groupId).toBeNull()
      expect(list[0]!.groupId).toBeNull() // «a» quedó solo
      expect(list[2]!.groupId).toBe(list[3]!.groupId)
      expect(list[2]!.groupId).not.toBeNull()
    })

    it('series y descanso se comparten en todo el grupo', () => {
      const list = linkWithNext(items('a', 'b'), 'a')
      const updated = updateGroup(list, list[0]!.groupId!, { sets: 4, restSec: 60 })
      expect(updated.every((i) => i.sets === 4 && i.restSec === 60)).toBe(true)
    })

    it('fixGroups deshace grupos no contiguos', () => {
      const list = items('a', 'b', 'c').map((i, k) => ({
        ...i,
        groupId: k === 1 ? null : 'g',
        technique: 'superserie' as const,
      }))
      expect(fixGroups(list).every((i) => i.groupId === null)).toBe(true)
    })
  })

  describe('duración estimada', () => {
    it('vacía es 0', () => expect(estimateMinutes([])).toBe(0))

    it('5 ejercicios normales rondan los 45–55 min', () => {
      const m = estimateMinutes(items('a', 'b', 'c', 'd', 'e'))
      expect(m).toBeGreaterThanOrEqual(40)
      expect(m).toBeLessThanOrEqual(55)
      expect(m % 5).toBe(0)
    })

    it('las alemanas pesan más que las normales; la superserie ahorra tiempo', () => {
      const normal = estimateMinutes(items('a', 'b'))
      const german = estimateMinutes(items('a', 'b').map((i) => applyTechnique(i, 'aleman')))
      const superset = estimateMinutes(linkWithNext(items('a', 'b'), 'a'))
      expect(german).toBeGreaterThan(normal)
      expect(superset).toBeLessThan(normal)
    })
  })

  it('etiqueta de reps', () => {
    const base = newItem('x', 0)
    expect(repsLabel(base)).toBe('8–12')
    expect(repsLabel(applyTechnique(base, 'aleman'))).toBe('10')
    expect(repsLabel(applyTechnique(base, 'ascendente'))).toBe('12·10·8·6')
  })
})
