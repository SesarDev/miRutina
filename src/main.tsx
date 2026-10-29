import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/global.css'
import { App } from '@/app/App'
import { ensureRoutineTemplates } from '@/db/routines'
import { ensureSeed } from '@/db/seed'
import { startSync } from '@/sync'

// Load the exercise catalogue in the background on first launch (or when it changed).
void ensureSeed().catch((error: unknown) => console.error('No se pudo cargar el catálogo', error))
void ensureRoutineTemplates().catch((error: unknown) =>
  console.error('No se pudieron cargar las rutinas predefinidas', error),
)

// Ask the browser not to evict local data (sessions are never lost).
void navigator.storage?.persist?.()

startSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
