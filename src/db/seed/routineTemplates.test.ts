import seed from './exercises.json'
import { ROUTINE_TEMPLATES } from './routineTemplates'

const ids = new Set((seed as { exercises: { id: string }[] }).exercises.map((e) => e.id))

describe('rutinas predefinidas', () => {
  it('hay 12 con ids únicos', () => {
    expect(ROUTINE_TEMPLATES).toHaveLength(12)
    expect(new Set(ROUTINE_TEMPLATES.map((t) => t.id)).size).toBe(12)
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
