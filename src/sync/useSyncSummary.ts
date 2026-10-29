import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import type { IconName } from '@/components/ui'
import { useSyncStore } from './store'

/** Failures in a row before the indicator turns into an error the user should see. */
const PERSISTENT_FAILURES = 3

export type SyncSummary = {
  visible: boolean
  icon: IconName
  label: string
  tone: 'neutral' | 'pending' | 'danger'
  pending: number
}

/** One place that turns engine state + outbox size into what the UI shows. */
export function useSyncSummary(): SyncSummary {
  const { status, failures } = useSyncStore()
  const pending = useLiveQuery(() => db.outbox.count(), [], 0)

  if (status === 'disabled' || status === 'signedOut') {
    return {
      visible: false,
      icon: 'cloud',
      label: 'Solo en este dispositivo',
      tone: 'neutral',
      pending,
    }
  }
  if (status === 'offline') {
    return { visible: true, icon: 'cloudOff', label: 'Sin conexión', tone: 'pending', pending }
  }
  if (status === 'error' && failures >= PERSISTENT_FAILURES) {
    return { visible: true, icon: 'alert', label: 'Error al sincronizar', tone: 'danger', pending }
  }
  if (status === 'syncing') {
    return { visible: true, icon: 'sync', label: 'Sincronizando…', tone: 'neutral', pending }
  }
  if (pending > 0 || status === 'error') {
    return {
      visible: true,
      icon: 'cloudPending',
      label: 'Cambios pendientes',
      tone: 'pending',
      pending,
    }
  }
  return { visible: true, icon: 'cloudCheck', label: 'Sincronizado', tone: 'neutral', pending }
}
