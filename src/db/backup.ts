/**
 * Backup: every user table (soft-deleted rows included) as one JSON file, and its import merged
 * with last-write-wins (a row is written only if it is new or the file's copy is newer). The
 * dataset catalogue is never exported; custom exercises are.
 */
import { putRaw } from './repo'
import { db, PRIMARY_KEY } from './schema'
import { SYNC_TABLES, type SyncedRows, type SyncTable } from './types'

export const BACKUP_APP = 'mirutina'
/** Format of the file; bump it if the shape of `tables` changes. */
export const BACKUP_FORMAT = 1
const LAST_EXPORT_KEY = 'lastExportAt'

export type Backup = {
  app: typeof BACKUP_APP
  format: number
  /** Dexie schema version of the app that wrote it. */
  schemaVersion: number
  exportedAt: string
  tables: { [T in SyncTable]: SyncedRows[T][] }
}

export const BACKUP_TABLE_LABELS: Record<SyncTable, string> = {
  exercises: 'Ejercicios propios',
  exerciseSettings: 'Ajustes de ejercicios',
  routines: 'Rutinas',
  plannedWorkouts: 'Entrenos planificados',
  sessions: 'Sesiones',
  setLogs: 'Series',
  bodyMetrics: 'Peso y medidas',
}

async function rowsOf<T extends SyncTable>(table: T): Promise<SyncedRows[T][]> {
  const rows = (await db.table(table).toArray()) as SyncedRows[T][]
  // Only custom exercises belong to the user; the catalogue comes with the app.
  return table === 'exercises' ? rows.filter((r) => (r as SyncedRows['exercises']).isCustom) : rows
}

export async function createBackup(now = new Date()): Promise<Backup> {
  const tables = {} as Backup['tables']
  for (const table of SYNC_TABLES) {
    ;(tables as Record<SyncTable, unknown[]>)[table] = await rowsOf(table)
  }
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    schemaVersion: db.verno,
    exportedAt: now.toISOString(),
    tables,
  }
}

/** «mirutina-2026-10-31.json» */
export function backupFileName(backup: Pick<Backup, 'exportedAt'>): string {
  return `mirutina-${backup.exportedAt.slice(0, 10)}.json`
}

export async function markExported(at: string) {
  await db.meta.put({ key: LAST_EXPORT_KEY, value: at })
}

export async function lastExportAt(): Promise<string | null> {
  const entry = await db.meta.get(LAST_EXPORT_KEY)
  return typeof entry?.value === 'string' ? entry.value : null
}

/** Validates a parsed file. Throws an Error with a message for the user. */
export function parseBackup(data: unknown): Backup {
  const fail = (why: string): never => {
    throw new Error(why)
  }
  if (!data || typeof data !== 'object') fail('El archivo no es una copia de miRutina.')
  const b = data as Partial<Backup>
  if (b.app !== BACKUP_APP) fail('El archivo no es una copia de miRutina.')
  if (typeof b.format !== 'number' || b.format > BACKUP_FORMAT) {
    fail('La copia es de una versión más nueva de la app. Actualiza la app e inténtalo otra vez.')
  }
  if (!b.tables || typeof b.tables !== 'object')
    fail('La copia está incompleta: faltan las tablas.')

  const tables = {} as Backup['tables']
  for (const table of SYNC_TABLES) {
    const rows = (b.tables as Record<string, unknown>)[table] ?? []
    if (!Array.isArray(rows)) fail(`La tabla «${BACKUP_TABLE_LABELS[table]}» no es válida.`)
    const key = PRIMARY_KEY[table]
    for (const row of rows as Record<string, unknown>[]) {
      if (!row || typeof row[key] !== 'string' || typeof row.updatedAt !== 'string') {
        fail(`Hay filas sin identificador o sin fecha en «${BACKUP_TABLE_LABELS[table]}».`)
      }
    }
    ;(tables as Record<SyncTable, unknown[]>)[table] = rows as unknown[]
  }
  return {
    app: BACKUP_APP,
    format: b.format!,
    schemaVersion: Number(b.schemaVersion) || 0,
    exportedAt: String(b.exportedAt ?? ''),
    tables,
  }
}

export type ImportPlanRow = { table: SyncTable; added: number; updated: number; unchanged: number }

type Split = { plan: ImportPlanRow; write: unknown[] }

async function split<T extends SyncTable>(table: T, rows: SyncedRows[T][]): Promise<Split> {
  const key = PRIMARY_KEY[table]
  const ids = rows.map((r) => (r as Record<string, string>)[key]!)
  const local = (await db.table(table).bulkGet(ids)) as (SyncedRows[T] | undefined)[]
  const plan: ImportPlanRow = { table, added: 0, updated: 0, unchanged: 0 }
  const write: SyncedRows[T][] = []
  rows.forEach((row, i) => {
    const current = local[i]
    if (!current) {
      plan.added++
      write.push(row)
    } else if ((row.updatedAt ?? '') > (current.updatedAt ?? '')) {
      plan.updated++
      write.push(row)
    } else {
      plan.unchanged++
    }
  })
  return { plan, write }
}

/** What an import would do, table by table (nothing is written). */
export async function planImport(backup: Backup): Promise<ImportPlanRow[]> {
  const out: ImportPlanRow[] = []
  for (const table of SYNC_TABLES) out.push((await split(table, backup.tables[table])).plan)
  return out
}

/** Writes the new and newer rows (last-write-wins) and queues them for sync. */
export async function applyImport(backup: Backup): Promise<ImportPlanRow[]> {
  const out: ImportPlanRow[] = []
  for (const table of SYNC_TABLES) {
    const { plan, write } = await split(table, backup.tables[table])
    await putRaw(table, write as SyncedRows[typeof table][])
    out.push(plan)
  }
  return out
}
