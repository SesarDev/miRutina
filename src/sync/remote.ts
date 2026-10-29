import type { SupabaseClient } from '@supabase/supabase-js'
import type { RemoteRow } from './mapping'

/** What the sync engine needs from the server; tests replace it with an in-memory fake. */
export interface RemoteStore {
  /** The signed-in user, or null (sync is skipped while signed out). */
  userId(): Promise<string | null>
  upsert(table: string, rows: RemoteRow[], onConflict: string): Promise<void>
  /** Rows with `server_updated_at` strictly after `since`, oldest first. */
  fetchSince(table: string, since: string | null, limit: number): Promise<RemoteRow[]>
}

/** Network/server failure: the engine retries with backoff. */
export class RemoteError extends Error {}

export function supabaseRemote(client: SupabaseClient): RemoteStore {
  return {
    async userId() {
      const { data } = await client.auth.getSession()
      return data.session?.user.id ?? null
    },

    async upsert(table, rows, onConflict) {
      const { error } = await client.from(table).upsert(rows, { onConflict })
      if (error) throw new RemoteError(`${table}: ${error.message}`)
    },

    async fetchSince(table, since, limit) {
      let query = client
        .from(table)
        .select('*')
        .order('server_updated_at', { ascending: true })
        .limit(limit)
      if (since) query = query.gt('server_updated_at', since)
      const { data, error } = await query
      if (error) throw new RemoteError(`${table}: ${error.message}`)
      return (data ?? []) as RemoteRow[]
    },
  }
}
