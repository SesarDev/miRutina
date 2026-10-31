/** Clocks of the session: elapsed time and the rest, both from timestamps (never counted ticks). */
import { useEffect, useRef, useState } from 'react'
import { usePrefs } from '@/lib/prefs'
import { skipRest, type Rest } from './sessionStore'

/** How long «Descanso terminado» stays before the timer goes away. */
const DONE_VISIBLE_MS = 5000
const VIBRATION_MS = [180, 80, 180]

/** Re-renders every second (only the components that show a running clock use it). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

/** «4:07» or «1:04:07». */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** Seconds left, from the end timestamp (right after the screen sleeps or the app returns). */
export function restRemaining(rest: Rest, now: number) {
  return Math.max(0, Math.ceil((rest.endsAt - now) / 1000))
}

/** Vibrates once when a rest ends while the app is open (not when reopening long after). */
export function useRestEnd(rest: Rest | null, now: number) {
  const vibrate = usePrefs((s) => s.vibrate)
  const notified = useRef<number | null>(null)
  const ended = rest !== null && now >= rest.endsAt

  useEffect(() => {
    if (!rest || !ended) return
    if (now - rest.endsAt > DONE_VISIBLE_MS) {
      skipRest()
      return
    }
    if (notified.current !== rest.endsAt) {
      notified.current = rest.endsAt
      if (vibrate) navigator.vibrate?.(VIBRATION_MS)
    }
    const id = window.setTimeout(skipRest, DONE_VISIBLE_MS - (now - rest.endsAt))
    return () => window.clearTimeout(id)
  }, [rest, ended, now, vibrate])

  return ended
}
