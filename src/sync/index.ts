import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createSyncEngine } from './engine'
import { supabaseRemote } from './remote'
import { setSyncState } from './store'
import { supabase } from './supabase'

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

export function useAuthSession(): Session | null | undefined {
  // undefined while loading
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null)
  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  return session
}

export async function sendMagicLink(email: string): Promise<string | null> {
  if (!supabase) return 'La sincronización no está configurada.'
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/ajustes` },
  })
  return error ? error.message : null
}

export async function signOut() {
  await supabase?.auth.signOut()
}
