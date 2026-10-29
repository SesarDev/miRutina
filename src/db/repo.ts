/**
 * The only write path of the app. Every change stamps `updatedAt`, queues the row in the
 * outbox and runs in one transaction, so a crash never leaves a change unsynced.
 */
import { toSearchTokens } from '@/lib/search'
import { db, PRIMARY_KEY } from './schema'
import type { SyncedRows, SyncFields, SyncTable } from './types'

type Input<T extends SyncTable> = Omit<SyncedRows[T], keyof SyncFields | 'searchTokens'> &
  Partial<SyncFields>

type WriteListener = (table: SyncTable) => void
const listeners = new Set<WriteListener>()

/** Subscribe to local writes (the sync engine debounces a push on it). */
export function onLocalWrite(listener: WriteListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const nowIso = () => new Date().toISOString()

export const newId = () => crypto.randomUUID()

function keyOf<T extends SyncTable>(table: T, row: SyncedRows[T]): string {
  return (row as Record<string, unknown>)[PRIMARY_KEY[table]] as string
}

async function enqueue(table: SyncTable, rowId: string, queuedAt: string) {
  // Keep a single pending entry per row: the push uploads its latest state.
  await db.outbox.where('[table+rowId]').equals([table, rowId]).delete()
  await db.outbox.add({ table, rowId, queuedAt })
}

function notify(table: SyncTable) {
  for (const listener of listeners) listener(table)
}

/** Inserts or replaces a row. Returns the stored row. */
export async function save<T extends SyncTable>(table: T, input: Input<T>): Promise<SyncedRows[T]> {
  const updatedAt = nowIso()
  const row = { deletedAt: null, ...input, updatedAt } as SyncedRows[T]
  if (table === 'exercises') {
    const ex = row as SyncedRows['exercises']
    ex.searchTokens = toSearchTokens(ex.name, ex.nameEs)
  }

  await db.transaction('rw', db.table(table), db.outbox, async () => {
    await db.table(table).put(row)
    await enqueue(table, keyOf(table, row), updatedAt)
  })
  notify(table)
  return row
}

/** Marks a row as deleted; it stays in the table and syncs the deletion. */
export async function softDelete(table: SyncTable, id: string): Promise<void> {
  const deletedAt = nowIso()
  await db.transaction('rw', db.table(table), db.outbox, async () => {
    const updated = await db.table(table).update(id, { deletedAt, updatedAt: deletedAt })
    if (updated) await enqueue(table, id, deletedAt)
  })
  notify(table)
}

/** Toggles (or sets) the favourite flag of an exercise, creating its settings row if needed. */
export async function setFavorite(exerciseId: string, favorite: boolean) {
  const current = await db.exerciseSettings.get(exerciseId)
  return save('exerciseSettings', {
    exerciseId,
    logType: current?.logType ?? 'weight_reps',
    repMin: current?.repMin ?? null,
    repMax: current?.repMax ?? null,
    note: current?.note ?? null,
    favorite,
  })
}
