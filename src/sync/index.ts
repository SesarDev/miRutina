/**
 * Sync entry point for the UI. The Supabase client and the engine (`./client`) load after the
 * first paint, or right away when the URL carries a magic-link token, so they never delay the
 * app opening. Everything still works local-only while (or if) they are not loaded.
 */
import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { whenIdle } from '@/lib/idle'
import { setSyncState } from './store'

/** True when the build has Supabase keys (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). */
export const isSyncConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
)

let client: Promise<typeof import('./client')> | null = null
const loadClient = () => (client ??= import('./client'))

/** Starts background sync without blocking the first paint. */
export function startSync() {
  if (!isSyncConfigured) {
    setSyncState({ status: 'disabled' })
    return
  }
  const start = () => void loadClient().then((m) => m.startSync())
  // The magic link brings the session in the URL: the client must read it straight away.
  if (/access_token|error_description/.test(window.location.hash)) start()
  else whenIdle(start)
}

/** Pushes and pulls now (after finishing a session, importing a backup…). */
export async function requestSync(): Promise<void> {
  if (!isSyncConfigured) return
  await (await loadClient()).syncEngine?.sync()
}

export function useAuthSession(): Session | null | undefined {
  // undefined while loading
  const [session, setSession] = useState<Session | null | undefined>(
    isSyncConfigured ? undefined : null,
  )
  useEffect(() => {
    if (!isSyncConfigured) return
    let unsubscribe = () => {}
    let active = true
    void loadClient().then(({ supabase }) => {
      if (!supabase || !active) return
      void supabase.auth.getSession().then(({ data }) => active && setSession(data.session))
      const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
      unsubscribe = () => data.subscription.unsubscribe()
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])
  return session
}

export async function sendMagicLink(email: string): Promise<string | null> {
  const { supabase } = await loadClient()
  if (!supabase) return 'La sincronización no está configurada.'
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/ajustes` },
  })
  return error ? error.message : null
}

export async function signOut() {
  await (await loadClient()).supabase?.auth.signOut()
}
