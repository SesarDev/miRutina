import { useEffect } from 'react'
import { dismissToast, useToastStore } from './toastStore'
import styles from './Toast.module.css'

export function Toaster() {
  const toast = useToastStore((s) => s.toast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(dismissToast, toast.durationMs)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className={styles.toast}>
          <span className={styles.message}>{toast.message}</span>
          {toast.actionLabel && (
            <button
              type="button"
              className={styles.action}
              onClick={() => {
                toast.onAction?.()
                dismissToast()
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
