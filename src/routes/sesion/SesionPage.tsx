import { getRouteApi, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button, buttonClassName, EmptyState, Sheet } from '@/components/ui'
import {
  useExerciseSettingsById,
  useExercisesById,
  useRoutine,
  useSession,
  useSessionRows,
} from '@/db/queries'
import { addExerciseToSession, itemsOf } from '@/db/sessions'
import { usePrefs } from '@/lib/prefs'
import { blocksOf, defaultWeightStep, sequence } from '@/lib/session'
import { ExercisePicker } from '@/routes/rutinas/ExercisePicker'
import { ControlPanel } from './ControlPanel'
import { usePersistentStorage, useWakeLock } from './device'
import { FinishButton, SessionSummary } from './FinishSession'
import { ExerciseCard } from './ExerciseCard'
import { SessionHeader } from './SessionHeader'
import { SessionNotes } from './SessionNotes'
import { selectRow, useSessionUi } from './sessionStore'
import styles from './Session.module.css'

const route = getRouteApi('/sesion/$sessionId')

export function SesionPage() {
  const { sessionId } = route.useParams()
  const session = useSession(sessionId)
  const rows = useSessionRows(sessionId)
  const routine = useRoutine(session?.routineId ?? '')
  const items = useMemo(() => (session ? itemsOf(session) : []), [session])
  const exerciseIds = items.map((i) => i.exerciseId)
  const exercises = useExercisesById(exerciseIds)
  const settings = useExerciseSettingsById(exerciseIds)
  const selectedRowId = useSessionUi((s) => s.selectedRowId)
  const defaultRestSec = usePrefs((s) => s.defaultRestSec)
  const keepScreenOn = usePrefs((s) => s.wakeLock)
  const [adding, setAdding] = useState(false)

  // A selection from another session (or a deleted row) falls back to «next set».
  useEffect(() => {
    if (rows && selectedRowId && !rows.some((r) => r.id === selectedRowId)) selectRow(null)
  }, [rows, selectedRowId])

  const steps = useMemo(() => sequence(items, rows ?? []), [items, rows])
  const open = !!session && !session.endedAt && !session.deletedAt
  useWakeLock(open && keepScreenOn)
  usePersistentStorage()

  if (session === undefined || rows === undefined) return null
  if (!session || session.deletedAt) {
    return (
      <>
        <PageHeader title="Sesión" />
        <EmptyState
          icon="today"
          title="Esta sesión no existe"
          description="Puede que se borrara o que el enlace esté incompleto. Empieza un entreno desde Hoy."
          actions={
            <Link to="/" className={buttonClassName({ variant: 'primary' })}>
              Ir a Hoy
            </Link>
          }
        />
      </>
    )
  }

  const title = session.routineId ? (routine?.name ?? 'Entreno') : 'Sesión libre'
  if (session.endedAt) return <SessionSummary session={session} rows={rows} title={title} />

  const next = steps.find((s) => !s.row.completedAt)
  const active = steps.find((s) => s.row.id === selectedRowId) ?? next
  const activeItem = items.find((i) => i.id === active?.itemId)
  // With every set done, the last exercise stays open (without armband) to review it.
  const expandedId = activeItem?.id ?? steps.at(-1)?.itemId
  const activeExercise = activeItem ? exercises.get(activeItem.exerciseId) : undefined
  const weightStep = activeItem
    ? (settings.get(activeItem.exerciseId)?.weightStep ??
      defaultWeightStep(activeExercise?.equipment ?? ''))
    : 1

  return (
    <div className={styles.session}>
      <SessionHeader
        session={session}
        title={title}
        action={<FinishButton session={session} rows={rows} />}
      />

      <div className={styles.body}>
        {items.length === 0 ? (
          <div className={styles.emptyList}>
            <p>Añade el primer ejercicio y empieza a registrar.</p>
          </div>
        ) : (
          <ol className={styles.exercises} aria-label="Ejercicios">
            {blocksOf(items).map((block) => {
              const cards = block.map((item) => (
                <ExerciseCard
                  key={item.id}
                  sessionId={session.id}
                  item={item}
                  index={items.indexOf(item)}
                  count={items.length}
                  exercise={exercises.get(item.exerciseId)}
                  rows={rows.filter((r) => r.exerciseId === item.exerciseId)}
                  active={item.id === expandedId}
                  activeRowId={active?.row.id ?? null}
                />
              ))
              if (block.length === 1) return cards
              const rounds = block.at(-1)!.sets
              return (
                <li key={block[0]!.groupId} className={styles.superset}>
                  <p className={styles.supersetLabel} id={`ss-${block[0]!.groupId}`}>
                    Superserie · <span className="num">{rounds}</span> rondas, alternando
                  </p>
                  <ol className={styles.exercises} aria-labelledby={`ss-${block[0]!.groupId}`}>
                    {cards}
                  </ol>
                </li>
              )
            })}
          </ol>
        )}

        <div className={styles.listActions}>
          <Button icon="plus" onClick={() => setAdding(true)}>
            Añadir ejercicio
          </Button>
        </div>

        <SessionNotes session={session} />
      </div>

      <ControlPanel
        session={session}
        items={items}
        rows={rows}
        step={active}
        exerciseName={activeExercise?.nameEs ?? ''}
        weightStep={weightStep}
        allDone={!next && rows.length > 0}
      />

      <Sheet open={adding} onClose={() => setAdding(false)} title="Añadir ejercicio">
        <ExercisePicker
          added={new Set(exerciseIds)}
          onAdd={(exerciseId) => {
            setAdding(false)
            void addExerciseToSession(session.id, exerciseId, defaultRestSec)
          }}
        />
      </Sheet>
    </div>
  )
}
