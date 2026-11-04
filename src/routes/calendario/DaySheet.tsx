import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button, buttonClassName, Icon, Sheet, showToast, Stepper } from '@/components/ui'
import {
  useDaySessions,
  usePlannedBetween,
  useRoutines,
  type DaySession,
  type PlannedEntry,
} from '@/db/queries'
import { discardSession, moveSessionDate } from '@/db/sessions'
import {
  MAX_REPEAT_WEEKS,
  moveWorkout,
  planWorkout,
  removeWorkout,
  restoreWorkout,
  setWorkoutStatus,
} from '@/db/planning'
import { formatDay, isValidDateKey, todayKey, type DateKey } from '@/lib/dates'
import { estimateMinutes } from '@/lib/routines'
import { WorkoutPill } from './WorkoutPill'
import styles from './Calendario.module.css'

type Props = { day: DateKey | null; onClose: () => void }

/**
 * Everything about one day: the sessions done (open, correct, move, delete), the planned
 * workouts (done by hand, skip, move, remove) and adding a routine.
 */
export function DaySheet({ day, onClose }: Props) {
  const title = day ? capitalize(formatDay(day, "EEEE, d 'de' MMMM")) : ''
  return (
    <Sheet open={day !== null} onClose={onClose} title={title}>
      {day && <DayBody key={day} day={day} />}
    </Sheet>
  )
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1)

function DayBody({ day }: { day: DateKey }) {
  const workouts = usePlannedBetween(day, day) ?? []
  const sessions = useDaySessions(day) ?? []
  return (
    <div className={styles.sheetBody}>
      {sessions.length > 0 && (
        <section aria-labelledby={`sessions-${day}`} className={styles.addSection}>
          <h3 id={`sessions-${day}`} className={styles.sheetSubtitle}>
            {sessions.length === 1 ? 'Sesión' : 'Sesiones'}
          </h3>
          <ul className={styles.sheetList}>
            {sessions.map((s) => (
              <SessionRow key={s.session.id} entry={s} />
            ))}
          </ul>
        </section>
      )}
      {workouts.length > 0 && (
        <section aria-label="Entrenos del día">
          <ul className={styles.sheetList}>
            {workouts.map((w) => (
              <PlannedRow key={w.id} workout={w} />
            ))}
          </ul>
        </section>
      )}
      <AddRoutine day={day} />
    </div>
  )
}

function PlannedRow({ workout }: { workout: PlannedEntry }) {
  const [moving, setMoving] = useState(false)
  const [target, setTarget] = useState(workout.date)

  const remove = async () => {
    await removeWorkout(workout.id)
    showToast({
      message: `«${workout.routineName}» quitada del calendario`,
      actionLabel: 'Deshacer',
      onAction: () => void restoreWorkout(workout.id),
    })
  }

  const move = async () => {
    if (!isValidDateKey(target) || target === workout.date) return setMoving(false)
    await moveWorkout(workout.id, target)
    showToast({ message: `Movido al ${formatDay(target, "EEEE d 'de' MMMM")}` })
  }

  return (
    <li className={styles.sheetRow}>
      <WorkoutPill workout={workout} />
      {workout.status !== 'done' && (
        <div className={styles.sheetActions}>
          {workout.status === 'planned' && !workout.sessionId && (
            <Button
              variant="ghost"
              icon="check"
              onClick={() => void setWorkoutStatus(workout.id, 'done')}
            >
              Marcar como hecho
            </Button>
          )}
          {workout.status === 'planned' ? (
            <Button
              variant="ghost"
              icon="skip"
              onClick={() => void setWorkoutStatus(workout.id, 'skipped')}
            >
              Marcar como saltado
            </Button>
          ) : (
            <Button
              variant="ghost"
              icon="clock"
              onClick={() => void setWorkoutStatus(workout.id, 'planned')}
            >
              Volver a planificar
            </Button>
          )}
          <Button
            variant="ghost"
            icon="calendar"
            onClick={() => setMoving((v) => !v)}
            aria-expanded={moving}
          >
            Mover a…
          </Button>
          <Button variant="ghost" icon="trash" onClick={() => void remove()}>
            Quitar
          </Button>
        </div>
      )}
      {moving && (
        <div className={styles.moveRow}>
          <label className={styles.moveLabel}>
            <span>Nuevo día</span>
            <input
              type="date"
              className={styles.dateInput}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </label>
          <Button variant="primary" onClick={() => void move()}>
            Mover
          </Button>
        </div>
      )}
    </li>
  )
}

const volumeFormat = new Intl.NumberFormat('es-ES')

/** A session of the day: what was done, and open, correct, move or delete it. */
function SessionRow({ entry }: { entry: DaySession }) {
  const { session, name, summary, records } = entry
  const [moving, setMoving] = useState(false)
  const [target, setTarget] = useState(session.date)
  const done = !!session.endedAt

  const facts = [
    done ? 'Hecha' : 'En curso',
    `${summary.exercises} ${summary.exercises === 1 ? 'ejercicio' : 'ejercicios'}`,
    `${summary.sets} ${summary.sets === 1 ? 'serie' : 'series'}`,
    summary.volume ? `${volumeFormat.format(summary.volume)} kg` : null,
    done ? `${summary.durationMin < 1 ? '< 1' : summary.durationMin} min` : null,
    records ? `${records} ${records === 1 ? 'récord' : 'récords'}` : null,
  ].filter(Boolean)

  const remove = async () => {
    const undo = await discardSession(session.id)
    showToast({
      message: `Sesión «${name}» borrada`,
      actionLabel: 'Deshacer',
      onAction: () => void undo(),
    })
  }

  const move = async () => {
    if (!isValidDateKey(target) || target === session.date) return setMoving(false)
    await moveSessionDate(session.id, target)
    showToast({ message: `Sesión movida al ${formatDay(target, "EEEE d 'de' MMMM")}` })
  }

  return (
    <li className={styles.sessionRow}>
      <p className={styles.sessionName}>{name}</p>
      <p className={`${styles.sessionFacts} num`}>{facts.join(' · ')}</p>
      <div className={styles.sheetActions}>
        <Link
          to="/sesion/$sessionId"
          params={{ sessionId: session.id }}
          className={buttonClassName({ variant: 'secondary' })}
        >
          {done ? 'Ver' : 'Continuar'}
        </Link>
        {done && (
          <Link
            to="/sesion/$sessionId"
            params={{ sessionId: session.id }}
            search={{ editar: 1 }}
            className={buttonClassName({ variant: 'ghost' })}
          >
            Corregir series
          </Link>
        )}
        <Button
          variant="ghost"
          icon="calendar"
          onClick={() => setMoving((v) => !v)}
          aria-expanded={moving}
        >
          Cambiar de día
        </Button>
        <Button variant="danger" icon="trash" onClick={() => void remove()}>
          Borrar
        </Button>
      </div>
      {moving && (
        <div className={styles.moveRow}>
          <label className={styles.moveLabel}>
            <span>Nuevo día</span>
            <input
              type="date"
              className={styles.dateInput}
              value={target}
              max={todayKey()}
              onChange={(e) => setTarget(e.target.value)}
            />
          </label>
          <Button variant="primary" onClick={() => void move()}>
            Mover
          </Button>
        </div>
      )}
    </li>
  )
}

function AddRoutine({ day }: { day: DateKey }) {
  const routines = useRoutines()
  const [repeat, setRepeat] = useState(false)
  const [weeks, setWeeks] = useState(4)

  const add = async (routineId: string, name: string) => {
    const created = await planWorkout(day, routineId, repeat ? weeks : 1)
    showToast({
      message:
        created.length > 1
          ? `«${name}» planificada ${created.length} semanas`
          : `«${name}» planificada`,
      actionLabel: 'Deshacer',
      onAction: () => void Promise.all(created.map((w) => removeWorkout(w.id))),
    })
  }

  if (routines === undefined) return null
  if (routines.length === 0) {
    return (
      <div className={styles.noRoutines}>
        <p>Para planificar un día necesitas al menos una rutina.</p>
        <Link to="/rutinas" search={{}} className={buttonClassName({ variant: 'primary' })}>
          Crear una rutina
        </Link>
      </div>
    )
  }

  return (
    <section className={styles.addSection} aria-labelledby="add-routine-title">
      <h3 id="add-routine-title" className={styles.sheetSubtitle}>
        Añadir rutina
      </h3>
      <label className={styles.repeat}>
        <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
        <span>Repetir cada semana</span>
      </label>
      {repeat && (
        <div className={styles.repeatWeeks}>
          <span className={styles.repeatLabel}>Durante</span>
          <Stepper
            label="Semanas"
            value={weeks}
            min={2}
            max={MAX_REPEAT_WEEKS}
            unit="semanas"
            onChange={setWeeks}
          />
        </div>
      )}
      <ul className={styles.routinePicker}>
        {routines.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className={styles.routineOption}
              onClick={() => void add(r.id, r.name)}
            >
              <span className={styles.routineOptionName}>{r.name}</span>
              <span className={`${styles.routineOptionMeta} num`}>
                {r.items.length} ejercicios · ≈ {estimateMinutes(r.items)} min
              </span>
              <Icon name="plus" size={20} className={styles.routineOptionIcon} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
