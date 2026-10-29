import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button, buttonClassName, Icon, Sheet, showToast, Stepper } from '@/components/ui'
import { usePlannedBetween, useRoutines, type PlannedEntry } from '@/db/queries'
import {
  MAX_REPEAT_WEEKS,
  moveWorkout,
  planWorkout,
  removeWorkout,
  restoreWorkout,
  setWorkoutStatus,
} from '@/db/planning'
import { formatDay, isValidDateKey, type DateKey } from '@/lib/dates'
import { estimateMinutes } from '@/lib/routines'
import { WorkoutPill } from './WorkoutPill'
import styles from './Calendario.module.css'

type Props = { day: DateKey | null; onClose: () => void }

/** Everything about one day: its workouts (skip, move, remove) and adding a routine. */
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
  return (
    <div className={styles.sheetBody}>
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
