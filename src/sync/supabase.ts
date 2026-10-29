import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Null when `.env.local` has no Supabase keys: the app then works fully local.
 * Implicit flow so the magic link works even if the e-mail opens in another browser tab.
 */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'implicit',
        },
      })
    : null

export const isSyncConfigured = supabase !== null
