import { useDraggable } from '@dnd-kit/core'
import { useDeferredValue, useMemo, useState } from 'react'
import { ExerciseThumb } from '@/components/exercise/ExerciseMedia'
import { Chip, IconButton, TextField } from '@/components/ui'
import { BODY_PART_LABELS, EQUIPMENT_LABELS, label, MUSCLE_LABELS } from '@/db/labels'
import { useExerciseIndex, useFavoriteIds } from '@/db/queries'
import type { Exercise } from '@/db/types'
import { BODY_PARTS, EMPTY_FILTERS, filterExercises } from '@/lib/exerciseSearch'
import { LIBRARY_DRAG_PREFIX } from './dnd'
import styles from './RoutineEditor.module.css'

const MAX_RESULTS = 60

type Props = {
  onAdd: (exerciseId: string) => void
  /** Desktop: rows can be dragged into the routine. */
  draggable?: boolean
  /** Ids already in the routine (shown as «Añadido»). */
  added: ReadonlySet<string>
}

export function ExercisePicker({ onAdd, draggable = false, added }: Props) {
  const { index, loading } = useExerciseIndex()
  const favorites = useFavoriteIds()
  const [query, setQuery] = useState('')
  const [part, setPart] = useState<string | null>(null)
  const [favOnly, setFavOnly] = useState(false)
  const deferredQuery = useDeferredValue(query)

  const results = useMemo(
    () =>
      index
        ? filterExercises(
            index,
            {
              ...EMPTY_FILTERS,
              query: deferredQuery,
              bodyParts: part ? [part] : [],
              favoritesOnly: favOnly,
            },
            favorites,
          )
        : [],
    [index, deferredQuery, part, favOnly, favorites],
  )

  return (
    <div className={styles.picker}>
      <TextField
        label="Buscar ejercicio para añadir"
        hideLabel
        type="search"
        icon="search"
        placeholder="Buscar ejercicio…"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={styles.pickerChips} role="group" aria-label="Filtrar por músculo">
        <Chip selected={favOnly} onClick={() => setFavOnly(!favOnly)}>
          Favoritos
        </Chip>
        {BODY_PARTS.slice(0, 8).map((p) => (
          <Chip key={p} selected={part === p} onClick={() => setPart(part === p ? null : p)}>
            {label(BODY_PART_LABELS, p)}
          </Chip>
        ))}
      </div>
      {loading ? (
        <p className={styles.pickerNote}>Cargando el catálogo…</p>
      ) : results.length === 0 ? (
        <p className={styles.pickerNote}>Nada coincide. Prueba en español o en inglés.</p>
      ) : (
        <ul className={styles.pickerList} aria-label="Resultados">
          {results.slice(0, MAX_RESULTS).map((ex) => (
            <PickerRow
              key={ex.id}
              exercise={ex}
              onAdd={onAdd}
              draggable={draggable}
              added={added.has(ex.id)}
            />
          ))}
        </ul>
      )}
      {results.length > MAX_RESULTS && (
        <p className={styles.pickerNote}>
          Mostrando {MAX_RESULTS} de {results.length}. Escribe más para afinar.
        </p>
      )}
    </div>
  )
}

function PickerRow({
  exercise,
  onAdd,
  draggable,
  added,
}: {
  exercise: Exercise
  onAdd: (id: string) => void
  draggable: boolean
  added: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${LIBRARY_DRAG_PREFIX}${exercise.id}`,
    data: { exerciseId: exercise.id },
    disabled: !draggable,
  })

  return (
    <li
      ref={setNodeRef}
      className={styles.pickerRow}
      data-dragging={isDragging || undefined}
      {...(draggable
        ? { ...attributes, ...listeners, 'aria-roledescription': 'ejercicio arrastrable' }
        : {})}
    >
      <ExerciseThumb src={exercise.image} />
      <span className={styles.pickerText}>
        <span className={styles.pickerName}>{exercise.nameEs}</span>
        <span className={styles.pickerMeta}>
          {label(MUSCLE_LABELS, exercise.target)} · {label(EQUIPMENT_LABELS, exercise.equipment)}
          {added && ' · En la rutina'}
        </span>
      </span>
      <IconButton
        icon="plus"
        label={`Añadir ${exercise.nameEs}`}
        outlined
        onClick={() => onAdd(exercise.id)}
        // Keep the drag sensor from swallowing the tap on the button.
        onPointerDown={(e) => e.stopPropagation()}
      />
    </li>
  )
}
