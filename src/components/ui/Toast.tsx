import { useEffect, useState } from 'react'
import { parseDuration } from '@/motion/tokens'
import { dismissToast, useToastStore, type ToastState } from './toastStore'
import styles from './Toast.module.css'

/** How long the closing toast stays mounted: its exit transition (--dur-fast). */
function exitMs() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--dur-fast')
  return parseDuration(value || '150ms') * 1000
}

export function Toaster() {
  const toast = useToastStore((s) => s.toast)
  // The last toast stays on screen while it fades out (transitions.dev «toast»).
  const [shown, setShown] = useState<ToastState>(toast)
  if (toast && toast !== shown) setShown(toast)
  const closing = !toast && shown !== null

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(dismissToast, toast.durationMs)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!closing) return
    const t = setTimeout(() => setShown(null), exitMs())
    return () => clearTimeout(t)
  }, [closing])

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {shown && (
        <div key={shown.id} className={styles.toast} data-closing={closing || undefined}>
          <span className={styles.message}>{shown.message}</span>
          {shown.actionLabel && (
            <button
              type="button"
              className={styles.action}
              disabled={closing}
              onClick={() => {
                shown.onAction?.()
                dismissToast()
              }}
            >
              {shown.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
