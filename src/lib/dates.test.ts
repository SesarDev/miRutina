import { startOfWeek } from 'date-fns'
import { DATE_OPTIONS, formatLongDay } from './dates'

describe('dates', () => {
  it('formatea el día en español', () => {
    expect(formatLongDay(new Date(2026, 9, 29))).toBe('jueves, 29 de octubre')
  })

  it('la semana empieza en lunes', () => {
    const monday = startOfWeek(new Date(2026, 10, 1), DATE_OPTIONS)
    expect(monday.getDay()).toBe(1)
    expect(monday.getDate()).toBe(26)
  })
})
