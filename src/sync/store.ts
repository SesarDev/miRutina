import { create } from 'zustand'

export type SyncStatus =
  /** No Supabase keys in .env.local: local only. */
  'disabled' | 'signedOut' | 'idle' | 'syncing' | 'offline' | 'error'

type SyncState = {
  status: SyncStatus
  lastSyncedAt: string | null
  error: string | null
  /** Consecutive failures; drives the retry delay and the «persistent error» signal. */
  failures: number
}

export const useSyncStore = create<SyncState>(() => ({
  status: 'disabled',
  lastSyncedAt: null,
  error: null,
  failures: 0,
}))

export const setSyncState = (patch: Partial<SyncState>) => useSyncStore.setState(patch)
