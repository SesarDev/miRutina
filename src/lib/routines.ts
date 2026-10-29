/** Pure routine logic: defaults per technique, ordering, supersets and duration estimate. */
import type { RoutineItem, SetTechnique } from '@/db/types'

type TechniqueDefaults = Pick<RoutineItem, 'sets' | 'repMin' | 'repMax' | 'restSec'> &
  Pick<RoutineItem, 'drops' | 'repsPerSet'>

/** Agreed with the user in F2 (docs/phases/F2). */
export const TECHNIQUE_DEFAULTS: Record<SetTechnique, TechniqueDefaults> = {
  normal: { sets: 3, repMin: 8, repMax: 12, restSec: 120 },
  aleman: { sets: 10, repMin: 10, repMax: 10, restSec: 90 },
  descendente: { sets: 3, repMin: 8, repMax: 12, restSec: 120, drops: 2 },
  ascendente: { sets: 4, repMin: 6, repMax: 12, restSec: 120, repsPerSet: [12, 10, 8, 6] },
  superserie: { sets: 3, repMin: 8, repMax: 12, restSec: 90 },
}

export const LIMITS = {
  sets: { min: 1, max: 20 },
  reps: { min: 1, max: 100 },
  restSec: { min: 0, max: 600, step: 15 },
  drops: { min: 1, max: 4 },
} as const

export function newItem(
  exerciseId: string,
  order: number,
  id: string = crypto.randomUUID(),
): RoutineItem {
  return {
    id,
    exerciseId,
    order,
    technique: 'normal',
    groupId: null,
    ...TECHNIQUE_DEFAULTS.normal,
  }
}

/** Switches an item to another technique with that technique's defaults. */
export function applyTechnique(item: RoutineItem, technique: SetTechnique): RoutineItem {
  const { drops: _d, repsPerSet: _r, ...base } = item
  return { ...base, technique, ...TECHNIQUE_DEFAULTS[technique] }
}

/** Keeps `order` equal to the array position. */
export function withOrder(items: RoutineItem[]): RoutineItem[] {
  return items.map((item, order) => (item.order === order ? item : { ...item, order }))
}

/**
 * Supersets must be contiguous and have 2+ exercises. Items that drifted out of their group
 * (after a drag) or groups left with a single item fall back to normal sets.
 */
export function fixGroups(items: RoutineItem[]): RoutineItem[] {
  const runs = new Map<string, number[]>()
  items.forEach((item, i) => {
    if (!item.groupId) return
    const run = runs.get(item.groupId) ?? []
    run.push(i)
    runs.set(item.groupId, run)
  })

  const keep = new Set<number>()
  for (const indexes of runs.values()) {
    // Keep the first contiguous run of the group.
    const contiguous = [indexes[0]!]
    for (let k = 1; k < indexes.length && indexes[k] === indexes[k - 1]! + 1; k++) {
      contiguous.push(indexes[k]!)
    }
    if (contiguous.length >= 2) contiguous.forEach((i) => keep.add(i))
  }

  return items.map((item, i) => {
    if (!item.groupId || keep.has(i)) return item
    return { ...applyTechnique(item, 'normal'), groupId: null }
  })
}

export function moveItem(items: RoutineItem[], fromId: string, toId: string): RoutineItem[] {
  const from = items.findIndex((i) => i.id === fromId)
  const to = items.findIndex((i) => i.id === toId)
  if (from < 0 || to < 0 || from === to) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved!)
  return withOrder(fixGroups(next))
}

export function removeItem(items: RoutineItem[], id: string): RoutineItem[] {
  return withOrder(fixGroups(items.filter((i) => i.id !== id)))
}

export function addExercise(items: RoutineItem[], exerciseId: string, at = items.length) {
  const next = [...items]
  next.splice(at, 0, newItem(exerciseId, at))
  return withOrder(fixGroups(next))
}

/** Joins an item with the next one into a superset (extending its group if it has one). */
export function linkWithNext(items: RoutineItem[], id: string): RoutineItem[] {
  const i = items.findIndex((it) => it.id === id)
  const current = items[i]
  const next = items[i + 1]
  if (!current || !next) return items
  const groupId = current.groupId ?? next.groupId ?? crypto.randomUUID()
  const { sets, restSec } = current.groupId ? current : TECHNIQUE_DEFAULTS.superserie
  return items.map((it) => {
    if (it.id !== current.id && it.id !== next.id && it.groupId !== groupId) return it
    const base = it.technique === 'superserie' ? it : applyTechnique(it, 'superserie')
    return { ...base, groupId, sets, restSec }
  })
}

/** Takes an item out of its superset (the rest of the group stays together if 2+ remain). */
export function unlink(items: RoutineItem[], id: string): RoutineItem[] {
  const i = items.findIndex((it) => it.id === id)
  const item = items[i]
  if (!item?.groupId) return items
  const groupIdx = items.flatMap((it, k) => (it.groupId === item.groupId ? [k] : []))
  const isEdge = i === groupIdx[0] || i === groupIdx.at(-1)
  const next = items.map((it, k) => {
    if (k === i) return { ...applyTechnique(it, 'normal'), groupId: null }
    // Removing a middle item splits the group: the tail gets a new group id.
    if (!isEdge && it.groupId === item.groupId && k > i)
      return { ...it, groupId: `${item.groupId}:b` }
    return it
  })
  return fixGroups(next)
}

/** Copies sets/rest to every member, so a superset is always N rounds with one rest. */
export function updateGroup(
  items: RoutineItem[],
  groupId: string,
  patch: Pick<Partial<RoutineItem>, 'sets' | 'restSec'>,
): RoutineItem[] {
  return items.map((it) => (it.groupId === groupId ? { ...it, ...patch } : it))
}

// ── Duration estimate ──

/** Seconds per working set (setup + execution) and per drop. */
const WORK_SEC = 45
const DROP_SEC = 25
/** Change of exercise / station. */
const TRANSITION_SEC = 60
/** General warm-up before the first exercise. */
const WARMUP_SEC = 300

function workPerSet(item: RoutineItem) {
  return WORK_SEC + (item.technique === 'descendente' ? (item.drops ?? 0) * DROP_SEC : 0)
}

/** Estimated minutes, rounded to 5 (shown as «≈ 45 min»). */
export function estimateMinutes(items: RoutineItem[]): number {
  let seconds = WARMUP_SEC
  const seenGroups = new Set<string>()
  for (const item of items) {
    if (item.groupId) {
      if (seenGroups.has(item.groupId)) continue
      seenGroups.add(item.groupId)
      const group = items.filter((it) => it.groupId === item.groupId)
      const rounds = Math.max(...group.map((g) => g.sets))
      const roundWork = group.reduce((s, g) => s + workPerSet(g), 0)
      seconds += rounds * roundWork + (rounds - 1) * item.restSec + TRANSITION_SEC
    } else {
      seconds += item.sets * workPerSet(item) + (item.sets - 1) * item.restSec + TRANSITION_SEC
    }
  }
  return items.length ? Math.max(5, Math.round(seconds / 60 / 5) * 5) : 0
}

/** Reps shown in lists: «8–12», «10», or «12·10·8·6» for a pyramid. */
export function repsLabel(item: RoutineItem): string {
  if (item.technique === 'ascendente' && item.repsPerSet?.length) return item.repsPerSet.join('·')
  return item.repMin === item.repMax ? `${item.repMin}` : `${item.repMin}–${item.repMax}`
}
