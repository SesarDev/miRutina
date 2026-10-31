import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button, buttonClassName, Sheet } from '@/components/ui'
import { useSessionRecords } from '@/db/queries'
import { finishSession } from '@/db/sessions'
import type { Session, SetLog } from '@/db/types'
import { formatDay } from '@/lib/dates'
import { summarize } from '@/lib/session'
import { syncEngine } from '@/sync'
import { RecordMoment } from './RecordMoment'
import { resetSessionUi } from './sessionStore'
import styles from './Session.module.css'

const volumeFormat = new Intl.NumberFormat('es-ES')

/** «45 min», «1 h 5 min», «< 1 min». */
function durationText(min: number) {
  if (min < 1) return '< 1 min'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`
}

/** «Terminar» in the header, with a confirmation that says what will be discarded. */
export function FinishButton({ session, rows }: { session: Session; rows: SetLog[] }) {
  const [open, setOpen] = useState(false)
  const pending = rows.filter((r) => !r.completedAt && !r.isWarmup && r.dropIndex === 0).length
  const done = rows.some((r) => r.completedAt)

  const finish = async () => {
    setOpen(false)
    await finishSession(session.id)
    resetSessionUi()
    // The summary replaces the session on this same screen.
    void syncEngine?.sync()
  }

  return (
    <>
      <button type="button" className={styles.finish} onClick={() => setOpen(true)}>
        Terminar
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="¿Terminar el entreno?">
        <div className={styles.finishSheet}>
          <p>
            {!done
              ? 'Aún no has marcado ninguna serie. Si terminas, la sesión se guarda vacía.'
              : pending > 0
                ? `Quedan ${pending} ${pending === 1 ? 'serie' : 'series'} sin marcar; no se guardarán.`
                : 'Todas las series están marcadas.'}
          </p>
          <Button variant="primary" size="lg" block onClick={() => void finish()}>
            Terminar entreno
          </Button>
          <Button block onClick={() => setOpen(false)}>
            Seguir entrenando
          </Button>
        </div>
      </Sheet>
    </>
  )
}

/** After «Terminar»: the records it set (if any) first, then what was done, plainly. */
export function SessionSummary({
  session,
  rows,
  title,
}: {
  session: Session
  rows: SetLog[]
  title: string
}) {
  const summary = summarize(session, rows)
  const records = useSessionRecords(session.id) ?? []
  const facts: [string, string][] = [
    ['Duración', durationText(summary.durationMin)],
    ['Ejercicios', String(summary.exercises)],
    ['Series', String(summary.sets)],
    ['Volumen', `${volumeFormat.format(summary.volume)} kg`],
  ]

  return (
    <div className={styles.summary}>
      <p className={styles.lastLabel}>{formatDay(session.date, "EEEE d 'de' MMMM")}</p>
      <h1 className={styles.summaryTitle}>{title}</h1>
      <p className={styles.summaryLead}>Entreno terminado.</p>
      {session.endedAt && <RecordMoment records={records} endedAt={session.endedAt} />}
      <dl className={styles.summaryFacts}>
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className="num">{value}</dd>
          </div>
        ))}
      </dl>
      {session.notes && <p className={styles.itemNote}>{session.notes}</p>}
      <Link to="/" className={buttonClassName({ variant: 'primary', size: 'lg', block: true })}>
        Ir a Hoy
      </Link>
    </div>
  )
}
