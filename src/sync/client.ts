/**
 * The part of sync that needs the Supabase client (~50 kB gzip). Loaded on demand by
 * `src/sync/index.ts`, so it stays out of the first-load bundle.
 */
import { createSyncEngine } from './engine'
import { supabaseRemote } from './remote'
import { setSyncState } from './store'
import { supabase } from './supabase'

export { supabase }

export const syncEngine = supabase ? createSyncEngine(supabaseRemote(supabase)) : null

/** Starts background sync; also syncs right after signing in (first upload of local data). */
export function startSync(): () => void {
  if (!supabase || !syncEngine) {
    setSyncState({ status: 'disabled' })
    return () => {}
  }
  const stop = syncEngine.start()
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') void syncEngine.sync()
    if (event === 'SIGNED_OUT') setSyncState({ status: 'signedOut' })
  })
  return () => {
    stop()
    data.subscription.unsubscribe()
  }
}
