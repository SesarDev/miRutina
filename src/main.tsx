import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/global.css'
import { App } from '@/app/App'
import { ensureSeed } from '@/db/seed'

// Load the exercise catalogue in the background on first launch (or when it changed).
void ensureSeed().catch((error: unknown) => console.error('No se pudo cargar el catálogo', error))

// Ask the browser not to evict local data (sessions are never lost).
void navigator.storage?.persist?.()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
