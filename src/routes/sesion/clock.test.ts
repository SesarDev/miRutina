import { formatClock, restRemaining } from './clock'
import { adjustRest, resetSessionUi, startRest, useSessionUi } from './sessionStore'

afterEach(() => {
  vi.useRealTimers()
  resetSessionUi()
})

describe('descanso', () => {
  it('se calcula desde la marca de fin: correcto tras un minuto con la pantalla bloqueada', () => {
    vi.useFakeTimers({ now: new Date('2026-10-31T10:00:00Z') })
    startRest('s', 90)
    const rest = useSessionUi.getState().rest!
    // No ticks run while the phone is locked; only the clock moves.
    vi.setSystemTime(new Date('2026-10-31T10:01:00Z'))
    expect(restRemaining(rest, Date.now())).toBe(30)
    vi.setSystemTime(new Date('2026-10-31T10:02:00Z'))
    expect(restRemaining(rest, Date.now())).toBe(0)
  })

  it('±15 s mueve el final y nunca lo deja en el pasado', () => {
    vi.useFakeTimers({ now: new Date('2026-10-31T10:00:00Z') })
    startRest('s', 60)
    adjustRest(15)
    expect(restRemaining(useSessionUi.getState().rest!, Date.now())).toBe(75)
    adjustRest(-120)
    expect(restRemaining(useSessionUi.getState().rest!, Date.now())).toBe(0)
  })

  it('un descanso de 0 s no arranca', () => {
    startRest('s', 0)
    expect(useSessionUi.getState().rest).toBeNull()
  })
})

describe('formatClock', () => {
  it.each([
    [0, '0:00'],
    [65, '1:05'],
    [3725, '1:02:05'],
  ])('%i s → %s', (sec, text) => {
    expect(formatClock(sec)).toBe(text)
  })
})
