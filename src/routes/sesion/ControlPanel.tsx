import { useEffect, useRef, type CSSProperties } from 'react'
import { Button, Icon } from '@/components/ui'
import { completeSet, setFeel, setSetValue, uncompleteSet } from '@/db/sessions'
import { unlockAudio } from '@/lib/beep'
import { FEEL_LABELS, FEELS, type Session, type SessionItem, type SetLog } from '@/db/types'
import {
  FEEL_TIMEOUT_MS,
  nextAfter,
  restAfter,
  targetReps,
  workIndexOf,
  type SequenceStep,
} from '@/lib/session'
import { usePrefs } from '@/lib/prefs'
import { PLATE_EQUIPMENT } from '@/lib/plates'
import { NextUp } from './NextUp'
import { PlatesButton } from './PlatesButton'
import { RestTimer } from './RestTimer'
import { SessionStepper } from './SessionStepper'
import { askFeel, closeFeelPrompt, selectRow, startRest, useSessionUi } from './sessionStore'
import styles from './Session.module.css'

const DOUBLE_TAP_MS = 600

type Props = {
  session: Session
  items: SessionItem[]
  rows: SetLog[]
  step: SequenceStep<SetLog> | undefined
  exerciseName: string
  weightStep: number
  allDone: boolean
  /** Correcting a finished session: marking a set starts no rest and asks no feel. */
  editing?: boolean
  /** Equipment of the active exercise (dataset key): bars get the plate calculator. */
  equipment?: string
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
  editing = false,
  equipment = '',
}: Props) {
  const rateLastOnly = usePrefs((p) => p.rateLastOnly)
  const feelPrompt = useSessionUi((s) =>
    s.feelPrompt?.sessionId === session.id ? s.feelPrompt : null,
  )
  const rest = useSessionUi((s) => (s.rest?.sessionId === session.id ? s.rest : null))
  const row = step?.row
  const item = items.find((i) => i.id === step?.itemId)
  const promptRow = feelPrompt ? rows.find((r) => r.id === feelPrompt.rowId) : undefined

  // No feel in FEEL_TIMEOUT_MS: the rest starts anyway.
  useEffect(() => {
    if (!feelPrompt) return
    const id = window.setTimeout(closeFeelPrompt, FEEL_TIMEOUT_MS)
    return () => window.clearTimeout(id)
  }, [feelPrompt])

  // «Serie hecha» stays in the same place for the next set: a sweaty double tap must not mark
  // two sets.
  const lockedUntil = useRef(0)
  // Any deliberate action in between (a feel, a stepper) shows intent and lifts the lock.
  const onEdit = () => {
    lockedUntil.current = 0
    closeFeelPrompt()
  }

  const markDone = async () => {
    if (!row || row.reps === null || Date.now() < lockedUntil.current) return
    // A tap: the moment browsers allow audio to start (the rest tone plays later).
    unlockAudio()
    lockedUntil.current = Date.now() + DOUBLE_TAP_MS
    closeFeelPrompt()
    await completeSet(row.id)
    const restSec = restAfter(items, rows, row.id)
    // The armband moves to the set that follows this one (the partner in a superset).
    const next = nextAfter(items, rows, row.id)?.row.id ?? null
    // «Valorar solo la última serie»: no feel prompt while sets of this exercise remain.
    const moreToCome = rows.some(
      (r) => r.exerciseId === row.exerciseId && r.id !== row.id && !r.isWarmup && !r.completedAt,
    )
    if (editing) {
      selectRow(next)
    } else if (row.isWarmup || (rateLastOnly && moreToCome)) {
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

  const promptLabel = promptRow
    ? promptRow.isWarmup
      ? 'Calentamiento'
      : `Serie ${
          workIndexOf(
            promptRow,
            rows.filter((r) => r.exerciseId === promptRow.exerciseId),
          ) + 1
        }`
    : ''

  return (
    <section className={styles.panel} aria-label="Registro de la serie">
      {rest && (
        <RestTimer
          rest={rest}
          next={
            step && item ? (
              <NextUp
                sessionId={session.id}
                step={step}
                rows={rows}
                name={exerciseName}
                label={setLabel}
              />
            ) : null
          }
        />
      )}

      {feelPrompt && promptRow && (
        <div className={styles.feelPrompt}>
          <p className={styles.panelLabel} id="feel-title">
            {promptLabel} · ¿Cómo ha ido? <span className={styles.optional}>Opcional</span>
            <span className="visually-hidden">
              . Si no eliges, el descanso empieza solo en {FEEL_TIMEOUT_MS / 1000} segundos.
            </span>
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
                  onEdit()
                }}
              >
                {FEEL_LABELS[feel]}
              </button>
            ))}
          </div>
          <div
            className={styles.feelTimeout}
            style={{ '--feel-timeout': `${FEEL_TIMEOUT_MS}ms` } as CSSProperties}
            aria-hidden="true"
          />
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
              onEdit={onEdit}
              onChange={(weight) => void setSetValue(row.id, { weight })}
              extra={PLATE_EQUIPMENT.has(equipment) ? <PlatesButton weight={row.weight} /> : null}
            />
            <SessionStepper
              label="reps"
              name="Repeticiones"
              value={row.reps}
              step={1}
              max={200}
              placeholder={targetReps(item, workIndex, row.dropIndex)}
              onEdit={onEdit}
              onChange={(reps) => void setSetValue(row.id, { reps })}
            />
          </div>

          {row.completedAt ? (
            <Button block size="lg" onClick={() => void uncompleteSet(row.id)}>
              Desmarcar serie
            </Button>
          ) : (
            <button
              type="button"
              className={styles.done}
              disabled={row.reps === null}
              onClick={() => void markDone()}
            >
              <Icon name="check" size={26} />
              {row.reps === null ? 'Indica las repeticiones' : 'Serie hecha'}
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
