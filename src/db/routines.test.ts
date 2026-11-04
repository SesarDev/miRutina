import 'fake-indexeddb/auto'
import { addExercise, linkWithNext, moveItem } from '@/lib/routines'
import {
  copyTemplate,
  createRoutine,
  deleteRoutine,
  duplicateRoutine,
  ensureRoutineTemplates,
  getRoutineOrTemplate,
  restoreRoutine,
  saveRoutine,
  templateRoutineId,
} from './routines'
import { db } from './schema'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('rutinas (repositorio)', () => {
  it('crea una rutina y guarda cada cambio (sin botón Guardar)', async () => {
    const r = await createRoutine('Torso')
    const items = addExercise(addExercise(r.items, '0025'), '0027')
    await saveRoutine({ ...r, items })
    const stored = await db.routines.get(r.id)
    expect(stored?.items.map((i) => i.exerciseId)).toEqual(['0025', '0027'])
    expect(await db.outbox.count()).toBe(1)
  })

  it('reordena y persiste el orden', async () => {
    const r = await createRoutine('Torso', addExercise(addExercise([], '0025'), '0027'))
    const [a, b] = r.items
    await saveRoutine({ ...r, items: moveItem(r.items, a!.id, b!.id) })
    const stored = await db.routines.get(r.id)
    expect(stored?.items.map((i) => [i.exerciseId, i.order])).toEqual([
      ['0027', 0],
      ['0025', 1],
    ])
  })

  it('borra (lógico) y deshace', async () => {
    const r = await createRoutine('Pierna')
    await deleteRoutine(r.id)
    expect((await db.routines.get(r.id))?.deletedAt).not.toBeNull()
    await restoreRoutine(r.id)
    expect((await db.routines.get(r.id))?.deletedAt).toBeNull()
  })

  it('duplica con ids nuevos para ejercicios y superseries', async () => {
    let items = addExercise(addExercise([], '0031'), '0060')
    items = linkWithNext(items, items[0]!.id)
    const r = await createRoutine('Brazos', items)
    const copy = await duplicateRoutine(r.id)
    expect(copy?.name).toBe('Brazos (copia)')
    expect(copy?.items[0]!.id).not.toBe(items[0]!.id)
    expect(copy?.items[0]!.groupId).not.toBe(items[0]!.groupId)
    expect(copy?.items[0]!.groupId).toBe(copy?.items[1]!.groupId)
  })

  it('carga las predefinidas y copia una a mis rutinas', async () => {
    expect(await ensureRoutineTemplates()).toBe(true)
    expect(await ensureRoutineTemplates()).toBe(false)
    expect(await db.routineTemplates.count()).toBe(12)
    const copy = await copyTemplate('tpl-pierna')
    expect(copy?.name).toBe('Pierna completa')
    expect(copy?.items.length).toBeGreaterThan(5)
    // The template itself never enters the outbox; the copy does.
    expect((await db.outbox.toArray()).map((e) => e.table)).toEqual(['routines'])
  })
})

describe('usar una predefinida sin copiarla', () => {
  it('se resuelve por su id derivado, con su nombre y ejercicios', async () => {
    await ensureRoutineTemplates()
    const [template] = await db.routineTemplates.toArray()
    const id = templateRoutineId(template!.id)
    expect(await getRoutineOrTemplate(id)).toMatchObject({
      id,
      name: template!.name,
      items: template!.items,
      isTemplate: true,
    })
    expect(await db.routines.count()).toBe(0)
    expect(await getRoutineOrTemplate('no-existe')).toBeUndefined()
  })
})
