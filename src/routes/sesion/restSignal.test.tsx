import { renderHook } from '@testing-library/react'
import { playCountdownTick, playRestEnd } from '@/lib/beep'
import { DEFAULT_PREFS, setPrefs } from '@/lib/prefs'
import { useRestEnd } from './clock'
import type { Rest } from './sessionStore'

vi.mock('@/lib/beep', () => ({
  playRestEnd: vi.fn(),
  playCountdownTick: vi.fn(),
  unlockAudio: vi.fn(),
}))

let n = 0
const restEnding = (inMs: number): Rest => ({
  sessionId: 's',
  // A different end each test: the «already signalled» memory is per rest.
  endsAt: 1_000_000 + ++n * 100_000 + inMs,
  totalSec: 90,
})

beforeEach(() => {
  vi.clearAllMocks()
  setPrefs(DEFAULT_PREFS)
  Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), configurable: true })
})

describe('aviso de fin de descanso', () => {
  it('suena una sola vez al terminar, aunque se vuelva a pintar o se cambie de pantalla', () => {
    const rest = restEnding(0)
    const { rerender, unmount } = renderHook(({ now }) => useRestEnd(rest, now), {
      initialProps: { now: rest.endsAt - 1000 },
    })
    expect(playRestEnd).not.toHaveBeenCalled()
    rerender({ now: rest.endsAt })
    rerender({ now: rest.endsAt + 500 })
    unmount()
    // Another timer component (the rest bar) mounts for the same rest.
    renderHook(() => useRestEnd(rest, rest.endsAt + 800))
    expect(playRestEnd).toHaveBeenCalledTimes(1)
  })

  it('sin sonido si está desactivado', () => {
    setPrefs({ sound: false })
    const rest = restEnding(0)
    renderHook(() => useRestEnd(rest, rest.endsAt))
    expect(playRestEnd).not.toHaveBeenCalled()
  })

  it('al reabrir la app mucho después del final no suena', () => {
    const rest = restEnding(0)
    renderHook(() => useRestEnd(rest, rest.endsAt + 60_000))
    expect(playRestEnd).not.toHaveBeenCalled()
  })

  it('pitidos de los últimos 3 s: uno por segundo, solo si están activados', () => {
    const rest = restEnding(0)
    const { rerender } = renderHook(({ now }) => useRestEnd(rest, now), {
      initialProps: { now: rest.endsAt - 5000 },
    })
    rerender({ now: rest.endsAt - 2500 })
    expect(playCountdownTick).not.toHaveBeenCalled()

    setPrefs({ countdownBeeps: true })
    for (const ms of [3000, 2800, 2000, 1000, 400]) rerender({ now: rest.endsAt - ms })
    expect(playCountdownTick).toHaveBeenCalledTimes(3)
  })
})
