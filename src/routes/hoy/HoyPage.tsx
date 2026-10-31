import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ExerciseThumb } from '@/components/exercise/ExerciseMedia'
import { PageHeader } from '@/components/PageHeader'
import { Button, buttonClassName, Icon, Sheet, type IconName } from '@/components/ui'
import {
  useExercisesById,
  useNextPlanned,
  useOpenSession,
  usePlannedBetween,
  useRoutine,
  useRoutines,
  useSessionsBetween,
  type PlannedEntry,
} from '@/db/queries'
import { startSession } from '@/db/sessions'
import { formatDay, formatLongDay, todayKey, WEEKDAY_INITIALS, weekDays } from '@/lib/dates'
import { estimateMinutes, repsLabel } from '@/lib/routines'
import styles from './HoyPage.module.css'

export function HoyPage() {
  const today = todayKey()
  const planned = usePlannedBetween(today, today)
  const openSession = useOpenSession()
  const todayWorkouts = (planned ?? []).filter((p) => p.status !== 'skipped')

  return (
    <>
      <PageHeader
        title="Hoy"
        subtitle={<time dateTime={today}>{formatLongDay(new Date())}</time>}
      />
      <div className={styles.page}>
        <div className={styles.main}>
          {openSession && (
            <Link
              to="/sesion/$sessionId"
              params={{ sessionId: openSession.id }}
              className={buttonClassName({ variant: 'primary', size: 'lg', block: true })}
            >
              <Icon name="play" size={20} />
              Continuar entreno
            </Link>
          )}

          {planned === undefined ? null : todayWorkouts.length > 0 ? (
            todayWorkouts.map((w) => <TodayWorkout key={w.id} workout={w} />)
          ) : (
            <NothingToday />
          )}
        </div>

        <div className={styles.side}>
          <WeekSummary />
          <Sections />
        </div>
      </div>
    </>
  )
}

// ── Section shortcuts: a quiet row at the end; today's workout comes first ──

const SECTIONS: { label: string; icon: IconName; to: string; search?: object }[] = [
  { label: 'Rutinas', icon: 'routines', to: '/rutinas', search: {} },
  { label: 'Calendario', icon: 'calendar', to: '/calendario', search: {} },
  { label: 'Favoritos', icon: 'star', to: '/biblioteca', search: { fav: true } },
  { label: 'Biblioteca', icon: 'library', to: '/biblioteca', search: {} },
]

function Sections() {
  return (
    <nav aria-label="Secciones">
      <ul className={styles.sections}>
        {SECTIONS.map((s) => (
          <li key={s.label}>
            <Link to={s.to} search={s.search} className={styles.section}>
              <Icon name={s.icon} size={20} className={styles.sectionIcon} />
              <span className={styles.sectionLabel}>{s.label}</span>
              <Icon name="chevronRight" size={18} className={styles.sectionChevron} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ── Today's workout ──

function TodayWorkout({ workout }: { workout: PlannedEntry }) {
  const navigate = useNavigate()
  const routine = useRoutine(workout.routineId)
  const exercises = useExercisesById(routine?.items.map((i) => i.exerciseId) ?? [])
  const [starting, setStarting] = useState(false)
  const done = workout.status === 'done'

  const start = async () => {
    setStarting(true)
    const session = await startSession({ plannedId: workout.id })
    void navigate({ to: '/sesion/$sessionId', params: { sessionId: session.id } })
  }

  return (
    <section className={styles.today} aria-labelledby={`today-${workout.id}`}>
      <h2 id={`today-${workout.id}`} className={styles.routineName}>
        {workout.routineName}
      </h2>
      <p className={`${styles.routineMeta} num`}>
        <span className={styles.state} data-done={done || undefined}>
          {done && <Icon name="check" size={16} />}
          {done ? 'Hecho hoy' : 'Toca hoy'}
        </span>
        {routine && (
          <>
            {' · '}
            {routine.items.length} ejercicios · ≈ {estimateMinutes(routine.items)} min
          </>
        )}
      </p>
      {!done && (
        <Button
          variant="primary"
          size="lg"
          block
          icon="play"
          onClick={() => void start()}
          disabled={starting}
        >
          Empezar
        </Button>
      )}
      {routine && routine.items.length > 0 && (
        <ol className={styles.exercises}>
          {routine.items.map((item) => {
            const ex = exercises.get(item.exerciseId)
            return (
              <li key={item.id} className={styles.exercise}>
                <ExerciseThumb src={ex?.image ?? ''} />
                <span className={styles.exerciseName}>{ex?.nameEs ?? '…'}</span>
                <span className={`${styles.exerciseSets} num`}>
                  {item.sets} × {repsLabel(item)}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

// ── Nothing planned today ──

function NothingToday() {
  const next = useNextPlanned(todayKey())
  const [open, setOpen] = useState(false)

  return (
    <section className={styles.nothing} aria-labelledby="nothing-title">
      <h2 id="nothing-title" className={styles.nothingTitle}>
        Hoy no tienes nada planificado
      </h2>
      {next && (
        <p className={styles.next}>
          Próximo: <strong>{next.routineName}</strong>, el{' '}
          {formatDay(next.date, "EEEE d 'de' MMMM")}.
        </p>
      )}
      {next === null && (
        <p className={styles.next}>
          No hay entrenos planificados.{' '}
          <Link to="/calendario" search={{}}>
            Planifica tu semana
          </Link>
          .
        </p>
      )}
      <div>
        <Button variant="secondary" icon="play" onClick={() => setOpen(true)}>
          Entrenar algo hoy
        </Button>
      </div>
      <StartSheet open={open} onClose={() => setOpen(false)} />
    </section>
  )
}

function StartSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const routines = useRoutines()

  const start = async (routineId: string | null) => {
    const session = await startSession({ routineId })
    onClose()
    void navigate({ to: '/sesion/$sessionId', params: { sessionId: session.id } })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Entrenar hoy">
      <ul className={styles.startList}>
        {routines?.map((r) => (
          <li key={r.id}>
            <button type="button" className={styles.startOption} onClick={() => void start(r.id)}>
              <span className={styles.startName}>{r.name}</span>
              <span className={`${styles.startMeta} num`}>
                {r.items.length} ejercicios · ≈ {estimateMinutes(r.items)} min
              </span>
            </button>
          </li>
        ))}
        <li>
          <button type="button" className={styles.startOption} onClick={() => void start(null)}>
            <span className={styles.startName}>Sesión libre</span>
            <span className={styles.startMeta}>Añade los ejercicios sobre la marcha</span>
          </button>
        </li>
      </ul>
    </Sheet>
  )
}

// ── Week summary ──

function WeekSummary() {
  const days = weekDays(todayKey())
  const planned = usePlannedBetween(days[0]!, days[6]!) ?? []
  const sessions = useSessionsBetween(days[0]!, days[6]!) ?? []
  const trainedDays = new Set(sessions.filter((s) => s.endedAt).map((s) => s.date))
  const plannedDays = new Set(planned.filter((p) => p.status !== 'skipped').map((p) => p.date))
  const today = todayKey()
  const total = Math.max(plannedDays.size, trainedDays.size)

  return (
    <section className={styles.week} aria-labelledby="week-title">
      <h2 id="week-title" className={styles.weekTitle}>
        Esta semana
      </h2>
      <p className={`${styles.weekCount} num`}>
        {total === 0 ? (
          'Sin entrenos planificados ni hechos'
        ) : (
          <>
            <strong>{trainedDays.size}</strong> de {total}{' '}
            {total === 1 ? 'día entrenado' : 'días entrenados'}
          </>
        )}
      </p>
      <ol className={styles.weekDays}>
        {days.map((d, i) => {
          const state = trainedDays.has(d) ? 'done' : plannedDays.has(d) ? 'planned' : 'rest'
          const label =
            state === 'done' ? 'entrenado' : state === 'planned' ? 'planificado' : 'descanso'
          return (
            <li
              key={d}
              className={styles.weekDay}
              data-state={state}
              data-today={d === today || undefined}
            >
              <span aria-hidden="true">{WEEKDAY_INITIALS[i]}</span>
              <span className={styles.weekMark} aria-hidden="true">
                {state === 'done' ? (
                  <Icon name="check" size={16} />
                ) : state === 'planned' ? (
                  '•'
                ) : (
                  ''
                )}
              </span>
              <span className="visually-hidden">
                {formatDay(d, 'EEEE')}: {label}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
