import { Link } from '@tanstack/react-router'
import { useMemo, useRef } from 'react'
import { ConsistencyGrid } from '@/components/progress/ConsistencyGrid'
import { Sparkline } from '@/components/progress/Sparkline'
import { PageHeader } from '@/components/PageHeader'
import { Chip, EmptyState, Icon } from '@/components/ui'
import { useProgressOverview, type RecentExercise, type RecentRecord } from '@/db/queries'
import { formatDay, todayKey, type DateKey } from '@/lib/dates'
import { relativeDay } from '@/lib/lastTime'
import { formatWeight } from '@/lib/numbers'
import { consistencyWeeks, formatRecord } from '@/lib/progress'
import { useRevealBatch } from '@/motion/scroll'
import styles from './ProgresoPage.module.css'

export function ProgresoPage() {
  const today = todayKey()
  const overview = useProgressOverview(today)
  const weeks = useMemo(
    () => consistencyWeeks(overview?.trainedDates ?? [], today),
    [overview?.trainedDates, today],
  )
  const page = useRef<HTMLDivElement>(null)
  useRevealBatch(page, '[data-reveal]', !!overview?.exercises.length)

  if (overview === undefined) return <PageHeader title="Progreso" />

  if (overview.exercises.length === 0) {
    return (
      <>
        <PageHeader title="Progreso" />
        <EmptyState
          icon="progress"
          title="Aún no hay nada que comparar"
          description="Cuando registres tus primeras sesiones verás aquí tus récords, el 1RM estimado y cómo evoluciona cada ejercicio, con tus valoraciones."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Progreso" />
      <div ref={page} className={styles.page}>
        <section className={styles.exercises} aria-labelledby="prog-ejercicios">
          <h2 id="prog-ejercicios" className={styles.title}>
            Ejercicios · últimos 90 días
          </h2>
          <ul className={styles.list}>
            {overview.exercises.map((e) => (
              <ExerciseRow key={e.exerciseId} exercise={e} today={today} />
            ))}
          </ul>
        </section>

        <div className={styles.side}>
          <section aria-labelledby="prog-constancia">
            <h2 id="prog-constancia" className={styles.title}>
              Constancia
            </h2>
            <ConsistencyGrid weeks={weeks} />
          </section>

          <section aria-labelledby="prog-records">
            <h2 id="prog-records" className={styles.title}>
              Récords · últimos 30 días
            </h2>
            <RecentRecords records={overview.records} />
          </section>
        </div>
      </div>
    </>
  )
}

function ExerciseRow({ exercise: e, today }: { exercise: RecentExercise; today: DateKey }) {
  const first = e.trend[0]
  const last = e.trend.at(-1)
  const value = (v: number) => (e.trendUnit === 'kg' ? `${formatWeight(v)} kg` : `${v} reps`)
  const trendText =
    first && last && e.trend.length > 1
      ? `${e.trendUnit === 'kg' ? 'Peso máximo' : 'Reps máximas'}: de ${value(first.value)} a ${value(last.value)}`
      : null

  return (
    <li data-reveal>
      <Link
        to="/ejercicio/$exerciseId"
        params={{ exerciseId: e.exerciseId }}
        search={{ tab: 'grafica' }}
        className={styles.row}
      >
        <span className={styles.rowMain}>
          <span className={styles.name}>{e.name}</span>
          <span className={styles.meta}>
            {relativeDay(e.lastDate, today)} · <span className="num">{e.lastSets}</span>
          </span>
          {trendText && <span className="visually-hidden">{trendText}</span>}
        </span>
        <Sparkline values={e.trend.map((p) => p.value)} />
        <span className={styles.feel}>{e.lastFeel && <Chip feel={e.lastFeel} />}</span>
      </Link>
    </li>
  )
}

function RecentRecords({ records }: { records: RecentRecord[] }) {
  // One entry per exercise and session, with all of its records.
  const groups = new Map<string, RecentRecord[]>()
  for (const r of records) {
    const key = `${r.sessionId}:${r.exerciseId}`
    groups.set(key, [...(groups.get(key) ?? []), r])
  }

  if (!groups.size) {
    return (
      <p className={styles.none}>
        Ningún récord en los últimos 30 días. Aquí aparecerán cuando superes una marca.
      </p>
    )
  }

  return (
    <ul className={styles.records}>
      {[...groups.entries()].map(([key, list]) => {
        const { exerciseId, name, date } = list[0]!
        return (
          <li key={key} data-reveal>
            <Link
              to="/ejercicio/$exerciseId"
              params={{ exerciseId }}
              search={{ tab: 'historial' }}
              className={styles.record}
            >
              <span className={styles.recordHead}>
                <Icon name="star" size={16} className={styles.star} />
                <span className={styles.name}>{name}</span>
                <time dateTime={date} className={styles.meta}>
                  {formatDay(date, 'd MMM')}
                </time>
              </span>
              {list.map((r) => (
                <span key={`${r.kind}-${r.weight ?? ''}`} className={styles.recordLine}>
                  {formatRecord(r)}
                </span>
              ))}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
