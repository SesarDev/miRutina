import { formatDay } from '@/lib/dates'
import { formatWeight } from '@/lib/numbers'
import type { PersonalRecords } from '@/lib/progress'
import styles from './Progress.module.css'

const volumeFormat = new Intl.NumberFormat('es-ES')
const day = (date: string) => formatDay(date, "d 'de' MMM yyyy")

/** Current personal bests of an exercise, as plain figures (the date says when). */
export function RecordCards({ records }: { records: PersonalRecords }) {
  const { maxWeight, best1RM, bestVolume, maxReps } = records
  const cards: { label: string; figure: string; unit?: string; meta: string }[] = []

  if (maxWeight) {
    cards.push({
      label: 'Peso máximo',
      figure: formatWeight(maxWeight.value),
      unit: 'kg',
      meta: `× ${maxWeight.reps} · ${day(maxWeight.date)}`,
    })
  }
  if (best1RM) {
    cards.push({
      label: '1RM estimado',
      figure: formatWeight(best1RM.value),
      unit: 'kg',
      meta: day(best1RM.date),
    })
  }
  if (bestVolume) {
    cards.push({
      label: 'Más volumen',
      figure: volumeFormat.format(bestVolume.value),
      unit: 'kg',
      meta: day(bestVolume.date),
    })
  }
  // Bodyweight work has no weight: its record is the reps.
  if (!maxWeight && maxReps) {
    cards.push({ label: 'Más reps', figure: String(maxReps.value), meta: day(maxReps.date) })
  }

  if (!cards.length) return null
  return (
    <dl className={styles.records} aria-label="Récords personales">
      {cards.map((c) => (
        <div key={c.label}>
          <dt>{c.label}</dt>
          <dd>
            <span className={styles.figure}>
              {c.figure}
              {c.unit && <span className={styles.unit}>{c.unit}</span>}
            </span>
            <span className={styles.meta}>{c.meta}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
