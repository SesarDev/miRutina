import { Chip, Icon } from '@/components/ui'
import type { HistorySession } from '@/db/queries'
import { formatDay, type DateKey } from '@/lib/dates'
import { relativeDay } from '@/lib/lastTime'
import { formatRecord, formatSet, workSets, type ExerciseRecord } from '@/lib/progress'
import styles from './Progress.module.css'

type Props = {
  sessions: HistorySession[]
  records: Map<string, ExerciseRecord[]>
  today: DateKey
}

/** Sessions of an exercise, most recent first: each work set with its feel, records marked. */
export function HistoryList({ sessions, records, today }: Props) {
  const shown = sessions.filter((s) => workSets(s.sets).length > 0)
  if (!shown.length) {
    return (
      <p className={styles.empty}>
        Cuando registres este ejercicio verás aquí tus series, con el peso, las reps y cómo te
        sentiste.
      </p>
    )
  }

  return (
    <ol className={styles.history} aria-label="Sesiones">
      {shown.map((s) => (
        <HistorySessionItem
          key={s.sessionId}
          session={s}
          records={records.get(s.sessionId) ?? []}
          today={today}
        />
      ))}
    </ol>
  )
}

function HistorySessionItem({
  session,
  records,
  today,
}: {
  session: HistorySession
  records: ExerciseRecord[]
  today: DateKey
}) {
  const recordSets = new Set(records.map((r) => r.setId).filter(Boolean))
  let index = 0

  return (
    <li className={styles.session}>
      <div className={styles.sessionHead}>
        <time dateTime={session.date} className={styles.date}>
          {formatDay(session.date, "EEEE d 'de' MMMM yyyy")}
        </time>
        <span className={styles.ago}>{relativeDay(session.date, today)}</span>
      </div>
      <ol className={styles.sets}>
        {workSets(session.sets).map((set) => {
          const drop = set.dropIndex > 0
          if (!drop) index++
          return (
            <li key={set.id} className={`${styles.set} ${drop ? styles.drop : ''}`}>
              <span className={styles.setIndex} aria-hidden={drop}>
                {drop ? '→' : index}
              </span>
              <span className={styles.setFigure}>
                {drop && <span className="visually-hidden">Bajada: </span>}
                {formatSet(set)}
                {recordSets.has(set.id) && (
                  <span className={styles.recordMark} role="img" aria-label="Récord">
                    <Icon name="star" size={18} />
                  </span>
                )}
              </span>
              {set.feel ? <Chip feel={set.feel} /> : <span />}
            </li>
          )
        })}
      </ol>
      {records.length > 0 && (
        <ul className={styles.sessionRecords} aria-label="Récords de esta sesión">
          {records.map((r) => (
            <li key={`${r.kind}-${r.weight ?? ''}`}>
              <span className={styles.recordMark} aria-hidden>
                <Icon name="star" size={16} />
              </span>
              {formatRecord(r)}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
