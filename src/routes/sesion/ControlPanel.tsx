import { useEffect } from 'react'
import { Button, Icon } from '@/components/ui'
import { completeSet, setFeel, uncompleteSet, updateSetRow } from '@/db/sessions'
import { FEEL_LABELS, FEELS, type Session, type SessionItem, type SetLog } from '@/db/types'
import {
  FEEL_TIMEOUT_MS,
  nextAfter,
  restAfter,
  targetReps,
  workIndexOf,
  type SequenceStep,
} from '@/lib/session'
import { RestTimer } from './RestTimer'
import { SessionStepper } from './SessionStepper'
import { askFeel, closeFeelPrompt, selectRow, startRest, useSessionUi } from './sessionStore'
import styles from './Session.module.css'

type Props = {
  session: Session
  items: SessionItem[]
  rows: SetLog[]
  step: SequenceStep<SetLog> | undefined
  exerciseName: string
  weightStep: number
  allDone: boolean
}

/**
 * The thumb zone: steppers and «Serie hecha» for the set with the armband, the optional feel
 * right after marking a set, and the rest timer. Never shows or computes a target weight.
 */
export function ControlPanel({
  session,
  items,
  rows,
  step,
  exerciseName,
  weightStep,
  allDone,
}: Props) {
  const feelPrompt = useSessionUi((s) =>
    s.feelPrompt?.sessionId === session.id ? s.feelPrompt : null,
  )
  const rest = useSessionUi((s) => (s.rest?.sessionId === session.id ? s.rest : null))
  const row = step?.row
  const item = items.find((i) => i.id === step?.itemId)
  const promptRow = feelPrompt ? rows.find((r) => r.id === feelPrompt.rowId) : undefined

  // No feel in 3 s: the rest starts anyway.
  useEffect(() => {
    if (!feelPrompt) return
    const id = window.setTimeout(closeFeelPrompt, FEEL_TIMEOUT_MS)
    return () => window.clearTimeout(id)
  }, [feelPrompt])

  const markDone = async () => {
    if (!row) return
    closeFeelPrompt()
    await completeSet(row.id)
    const restSec = restAfter(items, rows, row.id)
    // The armband moves to the set that follows this one (the partner in a superset).
    const next = nextAfter(items, rows, row.id)?.row.id ?? null
    if (row.isWarmup) {
      startRest(session.id, restSec)
      selectRow(next)
    } else {
      askFeel(row.id, session.id, restSec, next)
    }
  }

  const exerciseRows = row ? rows.filter((r) => r.exerciseId === row.exerciseId) : []
  const workIndex = row ? workIndexOf(row, exerciseRows) : 0
  const workTotal = new Set(exerciseRows.filter((r) => !r.isWarmup).map((r) => r.order)).size
  const setLabel = !row
    ? ''
    : row.isWarmup
      ? 'Calentamiento'
      : `Serie ${workIndex + 1} de ${workTotal}${row.dropIndex > 0 ? ` · bajada ${row.dropIndex}` : ''}`

  return (
    <section className={styles.panel} aria-label="Registro de la serie">
      {rest && <RestTimer rest={rest} />}

      {feelPrompt && promptRow && (
        <div className={styles.feelPrompt}>
          <p className={styles.panelLabel} id="feel-title">
            ¿Cómo ha ido? <span className={styles.optional}>Opcional</span>
          </p>
          <div className={styles.feels} role="group" aria-labelledby="feel-title">
            {FEELS.map((feel) => (
              <button
                key={feel}
                type="button"
                className={styles.feel}
                data-feel={feel}
                onClick={() => {
                  void setFeel(promptRow.id, feel)
                  closeFeelPrompt()
                }}
              >
                {FEEL_LABELS[feel]}
              </button>
            ))}
          </div>
          <div className={styles.feelTimeout} aria-hidden="true" />
        </div>
      )}

      {row && item ? (
        <>
          <p className={styles.panelLabel}>
            <span className={styles.panelExercise}>{exerciseName}</span>
            <span className={styles.panelSet}>{setLabel}</span>
          </p>

          {row.completedAt && !feelPrompt && !row.isWarmup && (
            <div className={styles.feels} role="group" aria-label="Valoración de la serie">
              {FEELS.map((feel) => (
                <button
                  key={feel}
                  type="button"
                  className={styles.feel}
                  data-feel={feel}
                  aria-pressed={row.feel === feel}
                  onClick={() => void setFeel(row.id, row.feel === feel ? null : feel)}
                >
                  {FEEL_LABELS[feel]}
                </button>
              ))}
            </div>
          )}

          <div className={styles.steppers}>
            <SessionStepper
              label="kg"
              name="Peso en kilos"
              value={row.weight}
              step={weightStep}
              decimals={1}
              onEdit={closeFeelPrompt}
              onChange={(weight) => void updateSetRow(row.id, { weight })}
            />
            <SessionStepper
              label="reps"
              name="Repeticiones"
              value={row.reps}
              step={1}
              max={200}
              placeholder={targetReps(item, workIndex, row.dropIndex)}
              onEdit={closeFeelPrompt}
              onChange={(reps) => void updateSetRow(row.id, { reps })}
            />
          </div>

          {row.completedAt ? (
            <Button block size="lg" onClick={() => void uncompleteSet(row.id)}>
              Desmarcar serie
            </Button>
          ) : (
            <button type="button" className={styles.done} onClick={() => void markDone()}>
              <Icon name="check" size={26} />
              Serie hecha
            </button>
          )}
        </>
      ) : (
        <p className={styles.allDone}>
          {allDone ? 'Todas las series hechas.' : 'Añade un ejercicio para empezar.'}
        </p>
      )}
    </section>
  )
}
