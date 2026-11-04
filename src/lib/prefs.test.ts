import { reminderDue } from './prefs'

describe('reminderDue', () => {
  const at = (h: number, m: number) => new Date(2026, 10, 4, h, m)
  it('a partir de la hora elegida, y nunca si está desactivado', () => {
    expect(reminderDue('19:00', at(18, 59))).toBe(false)
    expect(reminderDue('19:00', at(19, 0))).toBe(true)
    expect(reminderDue('19:00', at(22, 30))).toBe(true)
    expect(reminderDue(null, at(23, 0))).toBe(false)
    expect(reminderDue('mal', at(23, 0))).toBe(false)
  })
})
