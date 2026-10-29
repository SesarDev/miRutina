import { startOfWeek } from 'date-fns'
import {
  addDaysKey,
  addMonthsKey,
  addWeeksKey,
  DATE_OPTIONS,
  formatLongDay,
  formatMonth,
  formatWeekRange,
  fromDateKey,
  isValidDateKey,
  monthGrid,
  toDateKey,
  weekDays,
} from './dates'

describe('dates', () => {
  it('formatea el día en español', () => {
    expect(formatLongDay(new Date(2026, 9, 29))).toBe('jueves, 29 de octubre')
  })

  it('la semana empieza en lunes', () => {
    const monday = startOfWeek(new Date(2026, 10, 1), DATE_OPTIONS)
    expect(monday.getDay()).toBe(1)
    expect(monday.getDate()).toBe(26)
  })

  it('las claves YYYY-MM-DD van en hora local y vuelven igual', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(toDateKey(fromDateKey('2026-03-29'))).toBe('2026-03-29') // cambio de hora en España
    expect(isValidDateKey('2026-02-30')).toBe(false)
    expect(isValidDateKey('2026-02-28')).toBe(true)
  })

  it('suma días, semanas y meses cruzando meses y años', () => {
    expect(addDaysKey('2026-12-31', 1)).toBe('2027-01-01')
    expect(addWeeksKey('2026-10-26', 4)).toBe('2026-11-23')
    expect(addMonthsKey('2026-01-31', 1)).toBe('2026-02-28')
  })

  it('weekDays devuelve de lunes a domingo', () => {
    expect(weekDays('2026-10-29')).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ])
  })

  it('monthGrid cubre el mes en semanas completas', () => {
    const grid = monthGrid('2026-11-15')
    expect(grid[0]![0]).toEqual({ key: '2026-10-26', inMonth: false })
    expect(grid.flat().filter((d) => d.inMonth)).toHaveLength(30)
    expect(grid.every((w) => w.length === 7)).toBe(true)
    expect(grid.at(-1)!.at(-1)!.key).toBe('2026-12-06')
  })

  it('rótulos de semana y mes', () => {
    expect(formatWeekRange('2026-10-29')).toBe('26 oct – 1 nov')
    expect(formatWeekRange('2026-11-04')).toBe('2 – 8 de noviembre')
    expect(formatMonth('2026-11-04')).toBe('noviembre de 2026')
  })
})
