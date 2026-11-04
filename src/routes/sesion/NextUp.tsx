import { useLastSessions } from '@/db/queries'
import { FEEL_LABELS, type SetLog } from '@/db/types'
import { summarizeSets, summaryFeel } from '@/lib/lastTime'
import type { SequenceStep } from '@/lib/session'
import styles from './Session.module.css'

/**
 * Under the rest timer, when the next set starts another exercise: which one and how it went
 * last time, so the bar or the machine can be prepared while resting. Context, never a target.
 * (A next set of the same exercise is already in the panel below.)
 */
export function NextUp({
  sessionId,
  step,
  rows,
  name,
  label,
}: {
  sessionId: string
  step: SequenceStep<SetLog>
  rows: SetLog[]
  name: string
  label: string
}) {
  const exerciseId = step.row.exerciseId
  const started = rows.some((r) => r.exerciseId === exerciseId && r.completedAt)
  const last = useLastSessions(exerciseId, sessionId)?.[0]
  const feel = last ? summaryFeel(last.sets) : null
  if (started) return null

  return (
    <p className={styles.nextUp}>
      <span className={styles.nextLabel}>Siguiente</span>
      <span className={styles.nextName}>
        {name} · {label}
      </span>
      {last && (
        <span className={`${styles.nextLast} num`}>
          Última vez: {summarizeSets(last.sets)}
          {feel && ` · ${FEEL_LABELS[feel]}`}
        </span>
      )}
    </p>
  )
}
