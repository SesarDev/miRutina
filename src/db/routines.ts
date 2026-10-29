/** Routine writes (all through repo.save / softDelete, so they queue for sync). */
import { save, softDelete } from './repo'
import { db } from './schema'
import { ROUTINE_TEMPLATES, TEMPLATES_VERSION } from './seed/routineTemplates'
import type { Routine, RoutineItem } from './types'

const TEMPLATES_VERSION_KEY = 'routineTemplatesVersion'

/** Loads the built-in routines on first launch or when their version changes. */
export async function ensureRoutineTemplates(): Promise<boolean> {
  const current = await db.meta.get(TEMPLATES_VERSION_KEY)
  if (current?.value === TEMPLATES_VERSION) return false
  await db.transaction('rw', db.routineTemplates, db.meta, async () => {
    await db.routineTemplates.clear()
    await db.routineTemplates.bulkPut(ROUTINE_TEMPLATES)
    await db.meta.put({ key: TEMPLATES_VERSION_KEY, value: TEMPLATES_VERSION })
  })
  return true
}

/** New ids for every item and superset group, so a copy never shares them with its source. */
function cloneItems(items: RoutineItem[]): RoutineItem[] {
  const groups = new Map<string, string>()
  return items.map((item) => {
    let groupId: string | null = null
    if (item.groupId) {
      if (!groups.has(item.groupId)) groups.set(item.groupId, crypto.randomUUID())
      groupId = groups.get(item.groupId)!
    }
    return { ...item, id: crypto.randomUUID(), groupId }
  })
}

export function createRoutine(name: string, items: RoutineItem[] = []): Promise<Routine> {
  return save('routines', { id: crypto.randomUUID(), name, items })
}

export function saveRoutine(routine: Pick<Routine, 'id' | 'name' | 'items'>): Promise<Routine> {
  return save('routines', { id: routine.id, name: routine.name, items: routine.items })
}

export async function duplicateRoutine(id: string): Promise<Routine | undefined> {
  const source = await db.routines.get(id)
  if (!source) return undefined
  return createRoutine(`${source.name} (copia)`, cloneItems(source.items))
}

export async function copyTemplate(templateId: string): Promise<Routine | undefined> {
  const template = await db.routineTemplates.get(templateId)
  if (!template) return undefined
  return createRoutine(template.name, cloneItems(template.items))
}

export const deleteRoutine = (id: string) => softDelete('routines', id)

/** «Deshacer» after a delete: brings the routine back (a new change, so it syncs too). */
export async function restoreRoutine(id: string): Promise<void> {
  const routine = await db.routines.get(id)
  if (routine?.deletedAt) await save('routines', { ...routine, deletedAt: null })
}
