import { useRegisterSW } from 'virtual:pwa-register/react'
import { IconButton } from '@/components/ui'
import styles from './UpdatePrompt.module.css'

/** Look for a new version once an hour while the app stays open (an installed PWA rarely reloads). */
const CHECK_EVERY_MS = 60 * 60 * 1000

/**
 * «Nueva versión disponible · Recargar». The new service worker waits until the user reloads;
 * the notice stays hidden while a session is in progress, so an update never interrupts it.
 */
export function UpdatePrompt({ hidden }: { hidden: boolean }) {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => void registration.update(), CHECK_EVERY_MS)
    },
  })

  if (!needRefresh || hidden) return null
  return (
    <div className={styles.update} role="status">
      <span className={styles.text}>Nueva versión disponible</span>
      <button
        type="button"
        className={styles.reload}
        onClick={() => void updateServiceWorker(true)}
      >
        Recargar
      </button>
      <IconButton icon="close" label="Más tarde" onClick={() => setNeedRefresh(false)} />
    </div>
  )
}
