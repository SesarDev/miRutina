import seed from './exercises.json'
import { ROUTINE_TEMPLATES } from './routineTemplates'

const catalogue = (seed as { exercises: { id: string; equipment: string }[] }).exercises
const ids = new Set(catalogue.map((e) => e.id))
const equipment = new Map(catalogue.map((e) => [e.id, e.equipment]))

describe('rutinas predefinidas', () => {
  it('hay 40 con ids únicos', () => {
    expect(ROUTINE_TEMPLATES).toHaveLength(40)
    expect(new Set(ROUTINE_TEMPLATES.map((t) => t.id)).size).toBe(40)
  })

  it('las de mancuernas y banco solo usan mancuernas o el propio cuerpo', () => {
    const minimal = ROUTINE_TEMPLATES.filter((t) => t.minimal)
    expect(minimal).toHaveLength(28)
    for (const t of minimal)
      for (const item of t.items)
        expect(['dumbbell', 'body weight'], `${t.name}: ${item.exerciseId}`).toContain(
          equipment.get(item.exerciseId),
        )
  })

  it('cada grupo muscular tiene varias de mancuernas', () => {
    for (const part of ['chest', 'back', 'shoulders', 'upper arms', 'upper legs', 'waist']) {
      const n = ROUTINE_TEMPLATES.filter((t) => t.minimal && t.bodyParts.includes(part)).length
      expect(n, part).toBeGreaterThanOrEqual(2)
    }
  })

  it.each(ROUTINE_TEMPLATES.map((t) => [t.name, t] as const))(
    '%s usa ejercicios del catálogo y dura entre 25 y 80 min',
    (_name, t) => {
      for (const item of t.items) expect(ids.has(item.exerciseId), item.exerciseId).toBe(true)
      expect(t.durationMin).toBeGreaterThanOrEqual(25)
      expect(t.durationMin).toBeLessThanOrEqual(80)
      expect(t.items.map((i) => i.order)).toEqual(t.items.map((_, k) => k))
    },
  )

  it('las de superseries agrupan los ejercicios por parejas', () => {
    const brazos = ROUTINE_TEMPLATES.find((t) => t.id === 'tpl-brazos-superseries')!
    const groups = new Set(brazos.items.map((i) => i.groupId))
    expect(groups.size).toBe(3)
    expect(brazos.items.every((i) => i.technique === 'superserie')).toBe(true)
  })

  it('las alemanas usan 10 × 10', () => {
    const torso = ROUTINE_TEMPLATES.find((t) => t.id === 'tpl-torso-aleman')!
    expect(torso.items[0]).toMatchObject({ technique: 'aleman', sets: 10, repMin: 10, repMax: 10 })
  })
})
