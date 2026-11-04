/** Clocks of the session: elapsed time and the rest, both from timestamps (never counted ticks). */
import { useEffect, useState } from 'react'
import { playCountdownTick, playRestEnd } from '@/lib/beep'
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

// Module-level, so moving between the session and another screen (two timer components) never
// repeats a signal for the same rest.
let signalledEnd: number | null = null
let lastTick: string | null = null

/** Seconds of a rest that tick when «Pitidos en los últimos 3 s» is on. */
const COUNTDOWN_SEC = 3

/**
 * Signals the end of a rest once while the app is open: vibration and tone, each if enabled
 * (not when reopening long after). Optionally ticks the last seconds.
 */
export function useRestEnd(rest: Rest | null, now: number) {
  const { vibrate, sound, countdownBeeps } = usePrefs()
  const ended = rest !== null && now >= rest.endsAt
  const left = rest ? restRemaining(rest, now) : 0

  useEffect(() => {
    if (!rest || ended || !sound || !countdownBeeps) return
    const key = `${rest.endsAt}:${left}`
    if (left > 0 && left <= COUNTDOWN_SEC && lastTick !== key) {
      lastTick = key
      playCountdownTick()
    }
  }, [rest, ended, left, sound, countdownBeeps])

  useEffect(() => {
    if (!rest || !ended) return
    if (now - rest.endsAt > DONE_VISIBLE_MS) {
      skipRest()
      return
    }
    if (signalledEnd !== rest.endsAt) {
      signalledEnd = rest.endsAt
      if (vibrate) navigator.vibrate?.(VIBRATION_MS)
      if (sound) playRestEnd()
    }
    const id = window.setTimeout(skipRest, DONE_VISIBLE_MS - (now - rest.endsAt))
    return () => window.clearTimeout(id)
  }, [rest, ended, now, vibrate, sound])

  return ended
}
