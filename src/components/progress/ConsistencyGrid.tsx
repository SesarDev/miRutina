import { formatDay, WEEKDAY_INITIALS } from '@/lib/dates'
import type { ConsistencyWeek } from '@/lib/progress'
import styles from './Progress.module.css'

const days = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`

/** One column per week (oldest first), one cell per day; the count of each week underneath. */
export function ConsistencyGrid({ weeks }: { weeks: ConsistencyWeek[] }) {
  const total = weeks.reduce((sum, w) => sum + w.count, 0)
  const active = weeks.filter((w) => w.count > 0).length

  return (
    <div className={styles.consistency}>
      <p className={styles.consistencyLead}>
        {days(total)} en {weeks.length} semanas · entrenaste{' '}
        {active === weeks.length ? 'todas las semanas' : `${active} de ${weeks.length} semanas`}
      </p>
      <div className={styles.grid}>
        <ol className={styles.weekdays} aria-hidden="true">
          {WEEKDAY_INITIALS.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ol>
        <ol className={styles.weeks}>
          {weeks.map((w) => (
            <li
              key={w.start}
              className={styles.week}
              aria-label={`Semana del ${formatDay(w.start, "d 'de' MMMM")}: ${days(w.count)}`}
            >
              <span className={styles.weekDays} aria-hidden="true">
                {w.days.map((d) => (
                  <span
                    key={d.date}
                    className={styles.day}
                    data-trained={d.trained === null ? undefined : String(d.trained)}
                    title={formatDay(d.date, "EEEE d 'de' MMMM")}
                  />
                ))}
              </span>
              <span className={`${styles.weekCount} num`} aria-hidden="true">
                {w.count || '·'}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
