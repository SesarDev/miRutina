import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/** Shared date-fns options: Spanish locale, weeks start on Monday. */
export const DATE_OPTIONS = { locale: es, weekStartsOn: 1 } as const

/** «miércoles, 29 de octubre» */
export function formatLongDay(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM", DATE_OPTIONS)
}
