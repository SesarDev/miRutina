/**
 * Local-first sync: Dexie is the source the UI reads; Supabase is the meeting point
 * between devices.
 *
 *   push: outbox (oldest first) → upsert in batches → drop confirmed entries.
 *   pull: rows with server_updated_at > lastPulledAt → last-write-wins on updatedAt.
 *
 * The server applies the same LWW rule with a trigger (supabase/schema.sql).
 */
import { onLocalWrite } from '@/db/repo'
import { db, PRIMARY_KEY } from '@/db/schema'
import { SYNC_TABLES, type OutboxEntry, type SyncTable } from '@/db/types'
import { REMOTE_CONFLICT, REMOTE_TABLE, toLocal, toRemote, type RemoteRow } from './mapping'
import type { RemoteStore } from './remote'
import { setSyncState, useSyncStore } from './store'

export type SyncResult = 'ok' | 'skipped' | 'error'

type Options = {
  batchSize?: number
  pageSize?: number
  /** Debounce after a local write. */
  writeDelayMs?: number
  intervalMs?: number
  maxRetryDelayMs?: number
}

const lastPulledKey = (table: SyncTable) => `lastPulledAt:${table}`
const LAST_SYNCED_KEY = 'lastSyncedAt'

const time = (iso: string) => Date.parse(iso)

export function createSyncEngine(remote: RemoteStore, options: Options = {}) {
  const {
    batchSize = 200,
    pageSize = 1000,
    writeDelayMs = 2000,
    intervalMs = 60_000,
    maxRetryDelayMs = 60_000,
  } = options

  let running: Promise<SyncResult> | null = null
  let rerun = false
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let writeTimer: ReturnType<typeof setTimeout> | undefined

  async function push(userId: string) {
    const entries = await db.outbox.orderBy('seq').toArray()
    const byTable = new Map<SyncTable, OutboxEntry[]>()
    for (const entry of entries) {
      byTable.set(entry.table, [...(byTable.get(entry.table) ?? []), entry])
    }

    for (const [table, tableEntries] of byTable) {
      for (let i = 0; i < tableEntries.length; i += batchSize) {
        const batch = tableEntries.slice(i, i + batchSize)
        const rows = await db.table(table).bulkGet(batch.map((e) => e.rowId))
        const payload = rows
          .map((row) => (row ? toRemote(table, row, userId) : null))
          .filter((row): row is RemoteRow => row !== null)
        if (payload.length)
          await remote.upsert(REMOTE_TABLE[table], payload, REMOTE_CONFLICT[table])
        // Delete by seq: an entry re-queued during the upload has a new seq and survives.
        await db.outbox.bulkDelete(batch.map((e) => e.seq!))
      }
    }
  }

  async function pullTable(table: SyncTable) {
    const key = PRIMARY_KEY[table]
    for (;;) {
      const since = ((await db.meta.get(lastPulledKey(table)))?.value as string | undefined) ?? null
      const page = await remote.fetchSince(REMOTE_TABLE[table], since, pageSize)
      if (!page.length) return

      await db.transaction('rw', db.table(table), db.outbox, db.meta, async () => {
        for (const remoteRow of page) {
          const incoming = toLocal(table, remoteRow)
          const id = (incoming as Record<string, unknown>)[key] as string
          const local = (await db.table(table).get(id)) as { updatedAt?: string } | undefined
          if (local?.updatedAt && time(local.updatedAt) >= time(remoteRow.updated_at)) continue

          await db.table(table).put(incoming)
          // A pending local change older than the remote one has lost: do not push it.
          await db.outbox.where('[table+rowId]').equals([table, id]).delete()
        }
        const newest = page.at(-1)!.server_updated_at
        if (newest) await db.meta.put({ key: lastPulledKey(table), value: newest })
      })

      if (page.length < pageSize) return
    }
  }

  async function pull() {
    for (const table of SYNC_TABLES) await pullTable(table)
  }

  function scheduleRetry() {
    const { failures } = useSyncStore.getState()
    const delay = Math.min(maxRetryDelayMs, 1000 * 2 ** Math.max(0, failures - 1))
    clearTimeout(retryTimer)
    retryTimer = setTimeout(() => void sync(), delay)
  }

  async function run(): Promise<SyncResult> {
    const userId = await remote.userId()
    if (!userId) {
      setSyncState({ status: 'signedOut' })
      return 'skipped'
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setSyncState({ status: 'offline' })
      return 'skipped'
    }

    setSyncState({ status: 'syncing' })
    try {
      await push(userId)
      await pull()
      const now = new Date().toISOString()
      await db.meta.put({ key: LAST_SYNCED_KEY, value: now })
      clearTimeout(retryTimer)
      setSyncState({ status: 'idle', lastSyncedAt: now, error: null, failures: 0 })
      return 'ok'
    } catch (error) {
      const failures = useSyncStore.getState().failures + 1
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false
      setSyncState({
        status: offline ? 'offline' : 'error',
        error: error instanceof Error ? error.message : String(error),
        failures,
      })
      scheduleRetry()
      return 'error'
    }
  }

  /** Push then pull. Concurrent calls share the run; one more run follows if asked meanwhile. */
  function sync(): Promise<SyncResult> {
    if (running) {
      rerun = true
      return running
    }
    running = run().finally(() => {
      running = null
      if (rerun) {
        rerun = false
        void sync()
      }
    })
    return running
  }

  /** Wires the triggers: launch, back online, tab visible, every minute, after local writes. */
  function start(): () => void {
    void db.meta.get(LAST_SYNCED_KEY).then((m) => {
      if (m?.value) setSyncState({ lastSyncedAt: m.value as string })
    })
    void sync()

    const onOnline = () => void sync()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync()
    }
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void sync()
    }, intervalMs)
    const offWrite = onLocalWrite(() => {
      clearTimeout(writeTimer)
      writeTimer = setTimeout(() => void sync(), writeDelayMs)
    })
    const onOffline = () => setSyncState({ status: 'offline' })

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
      clearTimeout(writeTimer)
      clearTimeout(retryTimer)
      offWrite()
    }
  }

  return { sync, push, pull, start }
}

export type SyncEngine = ReturnType<typeof createSyncEngine>
