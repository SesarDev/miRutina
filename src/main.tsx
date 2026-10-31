import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/global.css'
import { App } from '@/app/App'
import { ensureRoutineTemplates } from '@/db/routines'
import { ensureSeed } from '@/db/seed'
import { closeStaleSessions } from '@/db/sessions'
import { whenIdle } from '@/lib/idle'
import { startSync } from '@/sync'

// Load the exercise catalogue in the background on first launch (or when it changed), once the
// first screen has painted: the 135 kB chunk must not compete with it.
whenIdle(() => {
  void ensureSeed().catch((error: unknown) => console.error('No se pudo cargar el catálogo', error))
})
void ensureRoutineTemplates().catch((error: unknown) =>
  console.error('No se pudieron cargar las rutinas predefinidas', error),
)

// A session left open on an earlier day must not be resumed as today's workout.
void closeStaleSessions().catch((error: unknown) =>
  console.error('No se pudieron cerrar las sesiones antiguas', error),
)

// Ask the browser not to evict local data (sessions are never lost).
void navigator.storage?.persist?.()

startSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
