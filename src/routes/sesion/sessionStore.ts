/**
 * Ephemeral UI of the session in progress. The data itself always lives in Dexie; this only
 * holds what is on screen: the selected set, the feel prompt and the rest timer.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Rest = {
  sessionId: string
  /** Epoch ms when the rest ends: correct after the screen sleeps or the app is closed. */
  endsAt: number
  totalSec: number
}

type SessionUi = {
  /** Set chosen by the user; null = the next pending one. */
  selectedRowId: string | null
  /** Set just completed, waiting for an optional feel before the rest starts. */
  feelPrompt: { rowId: string; sessionId: string; restSec: number } | null
  rest: Rest | null
}

export const useSessionUi = create<SessionUi>()(
  persist(() => ({ selectedRowId: null, feelPrompt: null, rest: null }) as SessionUi, {
    name: 'mirutina:session-ui',
    storage: createJSONStorage(() => localStorage),
    // Only the rest survives a reload; the selection goes back to «next set».
    partialize: (s) => ({ rest: s.rest }),
  }),
)

/**
 * Called right before the armband moves. The session screen registers the Flip capture
 * (sessionFlip.ts); keeping GSAP out of this module keeps it out of the first-load bundle.
 */
let beforeArmbandMove: (() => void) | null = null
export function onBeforeArmbandMove(fn: (() => void) | null) {
  beforeArmbandMove = fn
}

export const selectRow = (rowId: string | null) => {
  if (rowId !== useSessionUi.getState().selectedRowId) beforeArmbandMove?.()
  useSessionUi.setState({ selectedRowId: rowId })
}

export function startRest(sessionId: string, seconds: number) {
  useSessionUi.setState({
    feelPrompt: null,
    rest:
      seconds > 0 ? { sessionId, endsAt: Date.now() + seconds * 1000, totalSec: seconds } : null,
  })
}

/** After «Serie hecha»: ask for the feel; the rest starts when it is given or skipped. */
export function askFeel(
  rowId: string,
  sessionId: string,
  restSec: number,
  nextRowId: string | null,
) {
  beforeArmbandMove?.()
  useSessionUi.setState({ feelPrompt: { rowId, sessionId, restSec }, selectedRowId: nextRowId })
}

/** Starts the pending rest (feel given, 3 s passed, or the next set is being edited). */
export function closeFeelPrompt() {
  const prompt = useSessionUi.getState().feelPrompt
  if (prompt) startRest(prompt.sessionId, prompt.restSec)
}

export function adjustRest(deltaSec: number) {
  const { rest } = useSessionUi.getState()
  if (!rest) return
  const endsAt = Math.max(Date.now(), rest.endsAt + deltaSec * 1000)
  useSessionUi.setState({
    rest: { ...rest, endsAt, totalSec: Math.max(1, rest.totalSec + deltaSec) },
  })
}

export const skipRest = () => useSessionUi.setState({ rest: null })

export const resetSessionUi = () =>
  useSessionUi.setState({ selectedRowId: null, feelPrompt: null, rest: null })
