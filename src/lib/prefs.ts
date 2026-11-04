/** Preferences of this device (Ajustes). Kept in localStorage: they belong to the phone or the PC. */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Prefs = {
  /** Rest after the sets of an exercise added during a session (s). */
  defaultRestSec: number
  /** Short vibration when a rest ends (Android; iPhone ignores it). */
  vibrate: boolean
  /** Keep the screen on during a session. */
  wakeLock: boolean
  /** Tone when a rest ends (needs the app open). */
  sound: boolean
  /** Short ticks in the last 3 s of a rest. */
  countdownBeeps: boolean
  /** Ask the feel only after the last set of each exercise. */
  rateLastOnly: boolean
  /** Bar used by the plate calculator (kg). */
  barWeight: number
}

export const DEFAULT_PREFS: Prefs = {
  defaultRestSec: 120,
  vibrate: true,
  wakeLock: true,
  sound: true,
  countdownBeeps: false,
  rateLastOnly: false,
  barWeight: 20,
}

export const usePrefs = create<Prefs>()(
  persist(() => DEFAULT_PREFS, {
    name: 'mirutina:prefs',
    storage: createJSONStorage(() => localStorage),
  }),
)

export const setPrefs = (changes: Partial<Prefs>) => usePrefs.setState(changes)
