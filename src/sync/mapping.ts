/**
 * Local (camelCase, Dexie) ↔ remote (snake_case, Supabase) rows.
 * Remote rows also carry `user_id` and `server_updated_at`, which never reach Dexie.
 */
import { toSearchTokens } from '@/lib/search'
import type { SyncedRows, SyncTable } from '@/db/types'

export type RemoteRow = Record<string, unknown> & {
  updated_at: string
  deleted_at: string | null
  server_updated_at?: string
  user_id?: string
}

export const REMOTE_TABLE: Record<SyncTable, string> = {
  exercises: 'custom_exercises',
  exerciseSettings: 'exercise_settings',
  routines: 'routines',
  plannedWorkouts: 'planned_workouts',
  sessions: 'sessions',
  setLogs: 'set_logs',
  bodyMetrics: 'body_metrics',
}

/** Conflict target for upserts (exercise_settings has a composite key). */
export const REMOTE_CONFLICT: Record<SyncTable, string> = {
  exercises: 'id',
  exerciseSettings: 'user_id,exercise_id',
  routines: 'id',
  plannedWorkouts: 'id',
  sessions: 'id',
  setLogs: 'id',
  bodyMetrics: 'id',
}

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
const toCamel = (key: string) => key.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())

/** Local-only fields of custom exercises that the remote table does not have. */
const EXERCISE_LOCAL_ONLY = new Set(['name', 'image', 'gif', 'isCustom', 'searchTokens'])
const SERVER_ONLY = new Set(['user_id', 'server_updated_at'])

/** Returns null for rows that must not be uploaded (the dataset catalogue). */
export function toRemote<T extends SyncTable>(
  table: T,
  row: SyncedRows[T],
  userId: string,
): RemoteRow | null {
  if (table === 'exercises' && !(row as SyncedRows['exercises']).isCustom) return null
  const out: Record<string, unknown> = { user_id: userId }
  for (const [key, value] of Object.entries(row)) {
    if (table === 'exercises' && EXERCISE_LOCAL_ONLY.has(key)) continue
    out[toSnake(key)] = value
  }
  return out as RemoteRow
}

export function toLocal<T extends SyncTable>(table: T, remote: RemoteRow): SyncedRows[T] {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(remote)) {
    if (SERVER_ONLY.has(key)) continue
    out[toCamel(key)] = value
  }
  if (table === 'exercises') {
    Object.assign(out, { name: '', image: '', gif: '', isCustom: true })
    out.searchTokens = toSearchTokens(String(out.nameEs ?? ''))
  }
  return out as SyncedRows[T]
}
