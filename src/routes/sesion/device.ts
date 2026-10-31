/** Device helpers of the session in progress: keep the screen on and keep the data. */
import { useEffect } from 'react'

/**
 * Screen Wake Lock while `enabled`. The browser drops the lock when the page is hidden, so it
 * is asked for again whenever the page becomes visible.
 */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return
      try {
        const next = await navigator.wakeLock.request('screen')
        if (cancelled) void next.release()
        else lock = next
      } catch {
        // Battery saver or no user gesture yet: the screen simply may turn off.
      }
    }

    void request()
    document.addEventListener('visibilitychange', request)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', request)
      void lock?.release()
    }
  }, [enabled])
}

/** Asks the browser not to evict this site's storage (IndexedDB holds the only copy offline). */
export function usePersistentStorage() {
  useEffect(() => {
    void navigator.storage?.persist?.().catch(() => false)
  }, [])
}
