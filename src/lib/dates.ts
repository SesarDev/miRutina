import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'

/** Shared date-fns options: Spanish locale, weeks start on Monday. */
export const DATE_OPTIONS = { locale: es, weekStartsOn: 1 } as const

/** «miércoles, 29 de octubre» */
export function formatLongDay(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM", DATE_OPTIONS)
}

// ── Date keys: YYYY-MM-DD in local time (what plannedWorkouts and sessions store) ──

export type DateKey = string

export function toDateKey(date: Date): DateKey {
  return format(date, 'yyyy-MM-dd')
}

/** Noon avoids DST edge cases when the key is turned back into a Date. */
export function fromDateKey(key: DateKey): Date {
  return parse(`${key} 12:00`, 'yyyy-MM-dd HH:mm', new Date())
}

export const todayKey = () => toDateKey(new Date())

export function isValidDateKey(value: unknown): value is DateKey {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(fromDateKey(value).getTime())
  )
}

export function addDaysKey(key: DateKey, days: number): DateKey {
  return toDateKey(addDays(fromDateKey(key), days))
}

export function addWeeksKey(key: DateKey, weeks: number): DateKey {
  return toDateKey(addWeeks(fromDateKey(key), weeks))
}

export function addMonthsKey(key: DateKey, months: number): DateKey {
  return toDateKey(addMonths(fromDateKey(key), months))
}

/** Monday … Sunday of the week containing `key`. */
export function weekDays(key: DateKey): DateKey[] {
  const start = startOfWeek(fromDateKey(key), DATE_OPTIONS)
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)))
}

/** Full weeks (Mon–Sun) covering the month of `key`; days of other months included. */
export function monthGrid(key: DateKey): { key: DateKey; inMonth: boolean }[][] {
  const date = fromDateKey(key)
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(date), DATE_OPTIONS),
    end: endOfWeek(endOfMonth(date), DATE_OPTIONS),
  })
  const weeks: { key: DateKey; inMonth: boolean }[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(
      days.slice(i, i + 7).map((d) => ({ key: toDateKey(d), inMonth: isSameMonth(d, date) })),
    )
  }
  return weeks
}

/** «L», «M», «X»… (Spanish one-letter weekday, Monday first). */
export const WEEKDAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function formatDay(key: DateKey, pattern: string): string {
  return format(fromDateKey(key), pattern, DATE_OPTIONS)
}

/** «26 oct – 1 nov» or «3 – 9 nov» */
export function formatWeekRange(key: DateKey): string {
  const days = weekDays(key)
  const first = fromDateKey(days[0]!)
  const last = fromDateKey(days[6]!)
  return first.getMonth() === last.getMonth()
    ? `${format(first, 'd', DATE_OPTIONS)} – ${format(last, "d 'de' MMMM", DATE_OPTIONS)}`
    : `${format(first, 'd MMM', DATE_OPTIONS)} – ${format(last, 'd MMM', DATE_OPTIONS)}`
}

/** «noviembre de 2026» */
export function formatMonth(key: DateKey): string {
  return format(fromDateKey(key), "MMMM 'de' yyyy", DATE_OPTIONS)
}
