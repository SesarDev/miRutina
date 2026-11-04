import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ExerciseThumb } from '@/components/exercise/ExerciseThumb'
import { Icon, IconButton, Stepper } from '@/components/ui'
import { TECHNIQUE_LABELS, type Exercise, type RoutineItem, type SetTechnique } from '@/db/types'
import { LIMITS, repsLabel } from '@/lib/routines'
import { captureForRoute } from '@/motion/flip'
import styles from './RoutineEditor.module.css'

const SOLO_TECHNIQUES: SetTechnique[] = ['normal', 'aleman', 'descendente', 'ascendente']

type Props = {
  item: RoutineItem
  exercise?: Exercise
  expanded: boolean
  onToggle: () => void
  onChange: (patch: Partial<RoutineItem>) => void
  onTechnique: (technique: SetTechnique) => void
  onRemove: () => void
  /** Inside a superset: sets and rest are edited on the group. */
  inGroup: boolean
}

function summary(item: RoutineItem, inGroup: boolean) {
  const reps = repsLabel(item)
  if (inGroup) return `${reps} reps`
  const base = `${item.sets} × ${reps} · ${item.restSec} s`
  if (item.technique === 'descendente') return `${base} · ${item.drops ?? 0} bajadas`
  return item.technique === 'normal' ? base : `${base} · ${TECHNIQUE_LABELS[item.technique]}`
}

export function RoutineItemCard(props: Props) {
  const { item, exercise, expanded, onToggle, onRemove, inGroup } = props
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const name = exercise?.nameEs ?? 'Ejercicio'
  const bodyId = `item-${item.id}`

  return (
    <li
      ref={setNodeRef}
      className={styles.item}
      data-dragging={isDragging || undefined}
      data-expanded={expanded || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div className={styles.itemHead}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          className={styles.handle}
          aria-label={`Mover ${name}`}
          {...attributes}
          {...listeners}
        >
          <Icon name="grip" size={20} />
        </button>
        {exercise ? (
          <Link
            to="/ejercicio/$exerciseId"
            params={{ exerciseId: exercise.id }}
            className={styles.thumbLink}
            aria-label={`Ver la ficha de ${name}`}
            onClick={(e) => captureForRoute(e.currentTarget.querySelector('[data-flip-id]'))}
          >
            <ExerciseThumb src={exercise.image} flipId={`media-${exercise.id}`} />
          </Link>
        ) : (
          <ExerciseThumb src="" />
        )}
        <button
          type="button"
          className={styles.itemToggle}
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={onToggle}
        >
          <span className={styles.itemName}>{name}</span>
          <span className={`${styles.itemSummary} num`}>{summary(item, inGroup)}</span>
        </button>
        <IconButton icon="trash" label={`Quitar ${name}`} onClick={onRemove} />
      </div>
      {expanded && (
        <div id={bodyId} className={styles.itemBody}>
          <ItemFields {...props} />
        </div>
      )}
    </li>
  )
}

function ItemFields({ item, onChange, onTechnique, inGroup }: Props) {
  return (
    <>
      {!inGroup && (
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Técnica</span>
          <select
            className={styles.select}
            value={item.technique}
            onChange={(e) => onTechnique(e.target.value as SetTechnique)}
          >
            {SOLO_TECHNIQUES.map((t) => (
              <option key={t} value={t}>
                {TECHNIQUE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className={styles.steppers}>
        {!inGroup && (
          <Field label="Series">
            <Stepper
              label="Series"
              value={item.sets}
              min={LIMITS.sets.min}
              max={LIMITS.sets.max}
              onChange={(sets) =>
                onChange(
                  item.technique === 'ascendente' && item.repsPerSet
                    ? { sets, repsPerSet: resize(item.repsPerSet, sets) }
                    : { sets },
                )
              }
            />
          </Field>
        )}
        {item.technique === 'ascendente' ? (
          <RepsPerSet item={item} onChange={onChange} />
        ) : (
          <>
            <Field label="Reps mín.">
              <Stepper
                label="Reps mínimas"
                value={item.repMin}
                min={LIMITS.reps.min}
                max={LIMITS.reps.max}
                onChange={(repMin) => onChange({ repMin, repMax: Math.max(repMin, item.repMax) })}
              />
            </Field>
            <Field label="Reps máx.">
              <Stepper
                label="Reps máximas"
                value={item.repMax}
                min={LIMITS.reps.min}
                max={LIMITS.reps.max}
                onChange={(repMax) => onChange({ repMax, repMin: Math.min(repMax, item.repMin) })}
              />
            </Field>
          </>
        )}
        {!inGroup && (
          <Field label="Descanso">
            <Stepper
              label="Descanso en segundos"
              value={item.restSec}
              step={LIMITS.restSec.step}
              min={LIMITS.restSec.min}
              max={LIMITS.restSec.max}
              unit="s"
              onChange={(restSec) => onChange({ restSec })}
            />
          </Field>
        )}
        {item.technique === 'descendente' && (
          <Field label="Bajadas por serie">
            <Stepper
              label="Bajadas por serie"
              value={item.drops ?? 2}
              min={LIMITS.drops.min}
              max={LIMITS.drops.max}
              onChange={(drops) => onChange({ drops })}
            />
          </Field>
        )}
      </div>
    </>
  )
}

/** Keeps a pyramid's reps list in step with the number of sets (new sets repeat the last). */
function resize(reps: number[], sets: number) {
  if (reps.length >= sets) return reps.slice(0, sets)
  const last = reps.at(-1) ?? 8
  return [...reps, ...Array.from({ length: sets - reps.length }, () => last)]
}

function RepsPerSet({ item, onChange }: Pick<Props, 'item' | 'onChange'>) {
  const reps = item.repsPerSet ?? []
  const [text, setText] = useState(reps.join(' '))
  const commit = () => {
    const values = text
      .split(/[\s,·-]+/)
      .map((v) => Number.parseInt(v, 10))
      .filter((n) => Number.isFinite(n) && n > 0)
      .slice(0, LIMITS.sets.max)
    if (!values.length) return setText(reps.join(' '))
    setText(values.join(' '))
    onChange({
      repsPerSet: values,
      sets: values.length,
      repMin: Math.min(...values),
      repMax: Math.max(...values),
    })
  }
  return (
    <label className={`${styles.field} ${styles.wide}`}>
      <span className={styles.fieldLabel}>Reps de cada serie</span>
      <input
        className={`${styles.textInput} num`}
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-describedby={`hint-${item.id}`}
      />
      <span id={`hint-${item.id}`} className={styles.fieldHint}>
        Separadas por espacios, p. ej. 12 10 8 6. Cada número es una serie.
      </span>
    </label>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel} aria-hidden="true">
        {label}
      </span>
      {children}
    </div>
  )
}
