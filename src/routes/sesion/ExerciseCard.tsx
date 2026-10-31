import { useState } from 'react'
import { ExerciseThumb } from '@/components/exercise/ExerciseMedia'
import { WeightStepPicker } from '@/components/exercise/WeightStepPicker'
import { Button, Icon, IconButton, Sheet, showToast } from '@/components/ui'
import { useLastSessions } from '@/db/queries'
import {
  addSet,
  addWarmup,
  moveSessionItem,
  removeSet,
  setItemNote,
  setItemSkipped,
  updateSetRow,
} from '@/db/sessions'
import {
  FEEL_LABELS,
  TECHNIQUE_LABELS,
  type Exercise,
  type SessionItem,
  type SetLog,
} from '@/db/types'
import { todayKey } from '@/lib/dates'
import {
  formatLastTime,
  relativeDay,
  summarizeSets,
  summaryFeel,
  type PastSession,
} from '@/lib/lastTime'
import { formatWeight } from '@/lib/numbers'
import { chainsOf, progressOf, targetReps, workIndexOf } from '@/lib/session'
import { NoteField } from './SessionNotes'
import { selectRow } from './sessionStore'
import styles from './Session.module.css'

type Props = {
  sessionId: string
  item: SessionItem
  index: number
  count: number
  exercise: Exercise | undefined
  rows: SetLog[]
  active: boolean
  activeRowId: string | null
}

export function ExerciseCard({
  sessionId,
  item,
  index,
  count,
  exercise,
  rows,
  active,
  activeRowId,
}: Props) {
  const [options, setOptions] = useState(false)
  const name = exercise?.nameEs ?? 'Ejercicio'
  const { done, total } = progressOf(rows)
  const technique = item.technique !== 'normal' ? TECHNIQUE_LABELS[item.technique] : null

  const open = () => {
    if (item.skipped) return
    const pending = rows.find((r) => !r.completedAt) ?? rows.at(-1)
    if (pending) selectRow(pending.id)
  }

  return (
    <li
      className={styles.card}
      data-active={active || undefined}
      data-skipped={item.skipped || undefined}
    >
      <div className={styles.cardHead}>
        <button
          type="button"
          className={styles.cardToggle}
          aria-expanded={active}
          onClick={open}
          disabled={item.skipped}
        >
          <ExerciseThumb src={exercise?.image ?? ''} />
          <span className={styles.cardText}>
            <span className={styles.cardName}>{name}</span>
            <span className={styles.cardMeta}>
              {item.skipped ? (
                'Saltado'
              ) : (
                <>
                  <span className="num">
                    {done}/{total}
                  </span>{' '}
                  series{technique && ` · ${technique}`}
                </>
              )}
            </span>
          </span>
          {done === total && total > 0 && !item.skipped && (
            <Icon name="check" size={20} className={styles.cardDone} />
          )}
        </button>
        {item.skipped ? (
          <Button variant="ghost" onClick={() => void setItemSkipped(sessionId, item.id, false)}>
            Recuperar
          </Button>
        ) : (
          <IconButton icon="more" label={`Opciones de ${name}`} onClick={() => setOptions(true)} />
        )}
      </div>

      {active && (
        <div className={styles.cardBody}>
          <LastTime exerciseId={item.exerciseId} sessionId={sessionId} />
          <SetRows item={item} rows={rows} activeRowId={activeRowId} />
          {item.note && <p className={styles.itemNote}>{item.note}</p>}
        </div>
      )}

      <Sheet open={options} onClose={() => setOptions(false)} title={name}>
        <ExerciseOptions
          sessionId={sessionId}
          item={item}
          index={index}
          count={count}
          rows={rows}
          activeRowId={active ? activeRowId : null}
          exercise={exercise}
          onDone={() => setOptions(false)}
        />
      </Sheet>
    </li>
  )
}

/** «La espalda de la camiseta»: last time as a dorsal, the one before muted. Never a suggestion. */
function LastTime({ exerciseId, sessionId }: { exerciseId: string; sessionId: string }) {
  const sessions = useLastSessions(exerciseId, sessionId)
  if (sessions === undefined) return <div className={styles.lastTime} aria-busy="true" />
  const [last, previous] = sessions
  if (!last) return <p className={styles.firstTime}>Primera vez con este ejercicio</p>

  const today = todayKey()
  const feel = summaryFeel(last.sets)
  const { dorsal, line } = dorsalParts(last)

  return (
    <div className={styles.lastTime}>
      <p className="visually-hidden">{formatLastTime(last, today)}</p>
      <div aria-hidden="true">
        <p className={styles.lastLabel}>Última vez · {relativeDay(last.date, today)}</p>
        {dorsal !== null && (
          <p className={`${styles.dorsal} num`}>
            {formatWeight(dorsal)}
            <span className={styles.dorsalUnit}>kg</span>
          </p>
        )}
        <p className={`${styles.lastLine} num`} data-full={dorsal === null || undefined}>
          {line}
          {feel && (
            <span className={styles.feelTag} data-feel={feel}>
              {FEEL_LABELS[feel]}
            </span>
          )}
        </p>
      </div>
      {previous && (
        <p className={`${styles.previous} num`}>{formatLastTime(previous, today, 'Anterior')}</p>
      )}
    </div>
  )
}

/** Same weight on every set: the weight as the dorsal and «× 10, 10, 9» below; otherwise the full line. */
function dorsalParts(session: PastSession): { dorsal: number | null; line: string } {
  const chains = chainsOf(session.sets)
  const weights = new Set(session.sets.map((s) => s.weight))
  const straight = chains.every((c) => c.length === 1)
  const [weight] = weights
  if (straight && weights.size === 1 && weight != null) {
    return { dorsal: weight, line: `× ${session.sets.map((s) => s.reps ?? '—').join(', ')}` }
  }
  return { dorsal: null, line: summarizeSets(session.sets) }
}

function SetRows({
  item,
  rows,
  activeRowId,
}: {
  item: SessionItem
  rows: SetLog[]
  activeRowId: string | null
}) {
  return (
    <ol className={styles.sets} aria-label="Series">
      {rows.map((row) => {
        const workIndex = workIndexOf(row, rows)
        const isActive = row.id === activeRowId
        const target = targetReps(item, workIndex, row.dropIndex)
        const label = row.isWarmup ? 'C' : row.dropIndex > 0 ? '↳' : String(workIndex + 1)
        const note = row.isWarmup
          ? 'Calentamiento'
          : row.feel
            ? FEEL_LABELS[row.feel]
            : row.dropIndex > 0
              ? `Bajada ${row.dropIndex}`
              : row.completedAt
                ? ''
                : `Objetivo ${target}`
        const spoken = row.isWarmup
          ? 'Calentamiento'
          : row.dropIndex > 0
            ? `Serie ${workIndex + 1}, bajada ${row.dropIndex}`
            : `Serie ${workIndex + 1}`

        return (
          <li key={row.id}>
            <button
              type="button"
              className={styles.set}
              data-active={isActive || undefined}
              data-done={row.completedAt ? true : undefined}
              data-drop={row.dropIndex > 0 || undefined}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`${spoken}: ${valueText(row, target)}${row.completedAt ? ', hecha' : ''}${row.feel ? `, ${FEEL_LABELS[row.feel]}` : ''}`}
              onClick={() => selectRow(row.id)}
            >
              <span className={styles.setIndex}>{label}</span>
              <span className={styles.setNote} data-feel={row.feel ?? undefined}>
                {note}
              </span>
              <span className={`${styles.setValue} num`}>
                {row.weight !== null ? formatWeight(row.weight) : '—'}
                <span className={styles.setTimes}> × </span>
                {row.reps ?? <span className={styles.setTarget}>{target}</span>}
              </span>
              <span className={styles.setCheck}>
                {row.completedAt && <SetCheck completedAt={row.completedAt} />}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function valueText(row: SetLog, target: string) {
  const weight = row.weight !== null ? `${formatWeight(row.weight)} kilos` : 'sin peso'
  const reps = row.reps !== null ? `${row.reps} repeticiones` : `objetivo ${target}`
  return `${weight} por ${reps}`
}

function ExerciseOptions({
  sessionId,
  item,
  index,
  count,
  rows,
  activeRowId,
  exercise,
  onDone,
}: {
  sessionId: string
  item: SessionItem
  index: number
  count: number
  rows: SetLog[]
  activeRowId: string | null
  exercise: Exercise | undefined
  onDone: () => void
}) {
  const selected = rows.find((r) => r.id === activeRowId)
  const selectedLabel = selected
    ? selected.isWarmup
      ? 'el calentamiento'
      : `la serie ${workIndexOf(selected, rows) + 1}`
    : null
  const run = (action: () => Promise<unknown>) => () => {
    onDone()
    void action()
  }

  const removeSelected = async (row: SetLog, label: string) => {
    const undo = await removeSet(row.id)
    if (undo)
      showToast({
        message: `Quitada ${label}`,
        actionLabel: 'Deshacer',
        onAction: () => void undo(),
      })
  }
  const skip = async () => {
    await setItemSkipped(sessionId, item.id, true)
    showToast({
      message: 'Ejercicio saltado',
      actionLabel: 'Deshacer',
      onAction: () => void setItemSkipped(sessionId, item.id, false),
    })
  }

  return (
    <div className={styles.options}>
      <div className={styles.optionGroup}>
        <Button icon="plus" block onClick={run(() => addSet(sessionId, item.exerciseId))}>
          Añadir serie
        </Button>
        <Button
          block
          variant="secondary"
          onClick={run(() => addWarmup(sessionId, item.exerciseId))}
        >
          Añadir calentamiento
        </Button>
        {selected && selected.dropIndex === 0 && (
          <>
            <Button
              block
              variant="secondary"
              onClick={run(() => updateSetRow(selected.id, { isWarmup: !selected.isWarmup }))}
            >
              {selected.isWarmup
                ? 'Convertir el calentamiento en serie'
                : `Marcar ${selectedLabel} como calentamiento`}
            </Button>
            <Button
              block
              variant="ghost"
              icon="trash"
              onClick={run(() => removeSelected(selected, selectedLabel ?? 'la serie'))}
            >
              Quitar {selectedLabel}
            </Button>
          </>
        )}
        <Button block variant="ghost" icon="skip" onClick={run(skip)}>
          Saltar ejercicio
        </Button>
      </div>

      <NoteField
        label="Nota del ejercicio en esta sesión"
        value={item.note}
        placeholder="Agarre, asiento, molestias…"
        onSave={(text) => void setItemNote(sessionId, item.id, text)}
      />

      <details className={styles.more}>
        <summary className={styles.moreSummary}>
          Más opciones
          <Icon name="chevronDown" size={20} />
        </summary>
        <div className={styles.moreBody}>
          <div className={styles.optionRow}>
            <Button
              variant="secondary"
              icon="chevronLeft"
              disabled={index === 0}
              className={styles.up}
              onClick={run(() => moveSessionItem(sessionId, item.id, -1))}
            >
              Subir
            </Button>
            <Button
              variant="secondary"
              icon="chevronRight"
              disabled={index === count - 1}
              className={styles.down}
              onClick={run(() => moveSessionItem(sessionId, item.id, 1))}
            >
              Bajar
            </Button>
          </div>
          {exercise && <WeightStepPicker exercise={exercise} />}
        </div>
      </details>
    </div>
  )
}

/** A set marked just now draws its check (transitions.dev «success check»); older ones are still. */
const FRESH_MS = 2000

function SetCheck({ completedAt }: { completedAt: string }) {
  const [fresh] = useState(() => Date.now() - Date.parse(completedAt) < FRESH_MS)
  return (
    <span className="t-success-check" data-state={fresh ? 'in' : 'static'}>
      <Icon name="check" size={18} />
    </span>
  )
}
