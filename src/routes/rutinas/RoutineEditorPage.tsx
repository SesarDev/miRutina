import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ExerciseThumb } from '@/components/exercise/ExerciseMedia'
import { PageHeader } from '@/components/PageHeader'
import {
  Button,
  buttonClassName,
  EmptyState,
  Icon,
  IconButton,
  Sheet,
  showToast,
  Stepper,
} from '@/components/ui'
import { useExercise, useExercisesById, useRoutine } from '@/db/queries'
import { deleteRoutine, duplicateRoutine, restoreRoutine, saveRoutine } from '@/db/routines'
import { db } from '@/db/schema'
import type { Exercise, Routine, RoutineItem } from '@/db/types'
import {
  addExercise,
  applyTechnique,
  estimateMinutes,
  LIMITS,
  linkWithNext,
  moveItem,
  removeItem,
  unlink,
  updateGroup,
} from '@/lib/routines'
import { dndAccessibility } from '@/lib/dndA11y'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/useMediaQuery'
import { LIBRARY_DRAG_PREFIX } from './dnd'
import { ExercisePicker } from './ExercisePicker'
import { RoutineItemCard } from './RoutineItemCard'
import styles from './RoutineEditor.module.css'

const route = getRouteApi('/rutinas/$routineId')
const ROUTINE_DROP_ID = 'routine-drop'
const NAME_SAVE_DELAY_MS = 400

export function RoutineEditorPage() {
  const { routineId } = route.useParams()
  const routine = useRoutine(routineId)

  if (routine === undefined) return null
  if (!routine || routine.deletedAt) {
    return (
      <>
        <PageHeader title="Rutina" />
        <EmptyState
          icon="routines"
          title="Esta rutina no existe"
          description="Puede que la hayas borrado o que el enlace no sea correcto."
          actions={
            <Link to="/rutinas" search={{}} className={buttonClassName({ variant: 'primary' })}>
              Ir a mis rutinas
            </Link>
          }
        />
      </>
    )
  }
  return <Editor key={routine.id} routine={routine} />
}

type Block = { groupId: string | null; items: RoutineItem[] }

/** Consecutive items with the same groupId form a superset block. */
function toBlocks(items: RoutineItem[]): Block[] {
  const blocks: Block[] = []
  for (const item of items) {
    const last = blocks.at(-1)
    if (item.groupId && last?.groupId === item.groupId) last.items.push(item)
    else blocks.push({ groupId: item.groupId, items: [item] })
  }
  return blocks
}

function Editor({ routine }: { routine: Routine }) {
  const navigate = useNavigate()
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const [items, setItems] = useState(routine.items)
  const [name, setName] = useState(routine.name)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const lastSaved = useRef(routine.updatedAt)

  // Changes from another device (sync) replace the local copy; our own saves do not echo back.
  useEffect(() => {
    if (routine.updatedAt === lastSaved.current) return
    lastSaved.current = routine.updatedAt
    setItems(routine.items)
    setName(routine.name)
  }, [routine])

  const persist = async (next: { name?: string; items?: RoutineItem[] }) => {
    const saved = await saveRoutine({
      id: routine.id,
      name: next.name ?? name,
      items: next.items ?? items,
    })
    lastSaved.current = saved.updatedAt
  }

  const commit = (next: RoutineItem[]) => {
    setItems(next)
    void persist({ items: next })
  }

  // Name: save after a short pause while typing.
  useEffect(() => {
    if (name === routine.name) return
    const t = setTimeout(
      () => void persist({ name: name.trim() || 'Rutina sin nombre' }),
      NAME_SAVE_DELAY_MS,
    )
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- persist reads the latest items
  }, [name])

  const exercises = useExercisesById(items.map((i) => i.exerciseId))
  const added = useMemo(() => new Set(items.map((i) => i.exerciseId)), [items])
  const blocks = useMemo(() => toBlocks(items), [items])
  const minutes = estimateMinutes(items)

  const add = (exerciseId: string, at?: number) => {
    const next = addExercise(items, exerciseId, at)
    commit(next)
    setExpanded(null)
    // The exercise is new to the routine, so it is not in `exercises` yet.
    void db.exercises.get(exerciseId).then((exercise) =>
      showToast({ message: `Añadido: ${exercise?.nameEs ?? 'ejercicio'}`, durationMs: 2000 }),
    )
  }

  const patchItem = (id: string, patch: Partial<RoutineItem>) =>
    commit(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))

  const remove = async () => {
    await deleteRoutine(routine.id)
    showToast({
      message: `«${name}» borrada`,
      actionLabel: 'Deshacer',
      onAction: () => void restoreRoutine(routine.id),
    })
    void navigate({ to: '/rutinas', search: {} })
  }

  const duplicate = async () => {
    const copy = await duplicateRoutine(routine.id)
    if (copy) void navigate({ to: '/rutinas/$routineId', params: { routineId: copy.id } })
  }

  // ── Drag and drop ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragStart = (e: DragStartEvent) => setDragging(String(e.active.id))

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null)
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId.startsWith(LIBRARY_DRAG_PREFIX)) {
      const exerciseId = activeId.slice(LIBRARY_DRAG_PREFIX.length)
      const at = items.findIndex((i) => i.id === overId)
      if (at < 0) return add(exerciseId, items.length)
      // Dropped on the lower half of an exercise: insert after it.
      const dragged = active.rect.current.translated
      const below = dragged
        ? dragged.top + dragged.height / 2 > over.rect.top + over.rect.height / 2
        : false
      add(exerciseId, below ? at + 1 : at)
      return
    }
    if (activeId !== overId) commit(moveItem(items, activeId, overId))
  }

  const nameOf = (id: string | number) => {
    const key = String(id)
    if (key === ROUTINE_DROP_ID) return 'la rutina'
    const exerciseId = key.startsWith(LIBRARY_DRAG_PREFIX)
      ? key.slice(LIBRARY_DRAG_PREFIX.length)
      : items.find((i) => i.id === key)?.exerciseId
    return (exerciseId && exercises.get(exerciseId)?.nameEs) || 'el ejercicio'
  }

  const draggedExercise = dragging?.startsWith(LIBRARY_DRAG_PREFIX)
    ? dragging.slice(LIBRARY_DRAG_PREFIX.length)
    : items.find((i) => i.id === dragging)?.exerciseId

  const routineColumn = (
    <section className={styles.routine} aria-label="Ejercicios de la rutina">
      <RoutineList
        blocks={blocks}
        items={items}
        exercises={exercises}
        expanded={expanded}
        setExpanded={setExpanded}
        patchItem={patchItem}
        commit={commit}
      />
      {!desktop && (
        <Button variant="primary" size="lg" block icon="plus" onClick={() => setPickerOpen(true)}>
          Añadir ejercicio
        </Button>
      )}
    </section>
  )

  return (
    <>
      <Link
        to="/rutinas"
        search={{}}
        className={`${buttonClassName({ variant: 'ghost' })} ${styles.back}`}
      >
        <Icon name="chevronLeft" size={20} />
        Rutinas
      </Link>

      <header className={styles.header}>
        <label className={styles.nameField}>
          <span className="visually-hidden">Nombre de la rutina</span>
          <input
            className={styles.nameInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => !name.trim() && setName('Rutina sin nombre')}
            maxLength={60}
            autoComplete="off"
          />
        </label>
        <p className={`${styles.meta} num`}>
          {items.length === 1 ? '1 ejercicio' : `${items.length} ejercicios`}
          {minutes > 0 && ` · ≈ ${minutes} min`}
          <span className={styles.saved}> · Guardado automáticamente</span>
        </p>
        <div className={styles.headerActions}>
          <IconButton icon="copy" label="Duplicar rutina" onClick={() => void duplicate()} />
          <IconButton icon="trash" label="Borrar rutina" onClick={() => void remove()} />
        </div>
      </header>

      <DndContext
        sensors={sensors}
        accessibility={dndAccessibility(nameOf)}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        {desktop ? (
          <div className={styles.columns}>
            <aside className={styles.library} aria-label="Biblioteca">
              <h2 className={styles.columnTitle}>Biblioteca</h2>
              <p className={styles.columnHint}>Arrastra un ejercicio a la rutina o pulsa +.</p>
              <ExercisePicker onAdd={(id) => add(id)} draggable added={added} />
            </aside>
            {routineColumn}
          </div>
        ) : (
          routineColumn
        )}
        <DragOverlay dropAnimation={null}>
          {draggedExercise ? <DragPreview exerciseId={draggedExercise} /> : null}
        </DragOverlay>
      </DndContext>

      {!desktop && (
        <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Añadir ejercicio">
          <ExercisePicker onAdd={(id) => add(id)} added={added} />
        </Sheet>
      )}
    </>
  )
}

function RoutineList({
  blocks,
  items,
  exercises,
  expanded,
  setExpanded,
  patchItem,
  commit,
}: {
  blocks: Block[]
  items: RoutineItem[]
  exercises: Map<string, Exercise>
  expanded: string | null
  setExpanded: (id: string | null) => void
  patchItem: (id: string, patch: Partial<RoutineItem>) => void
  commit: (items: RoutineItem[]) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: ROUTINE_DROP_ID })

  const card = (item: RoutineItem, inGroup: boolean) => (
    <RoutineItemCard
      key={item.id}
      item={item}
      exercise={exercises.get(item.exerciseId)}
      inGroup={inGroup}
      expanded={expanded === item.id}
      onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
      onChange={(patch) => patchItem(item.id, patch)}
      onTechnique={(t) =>
        commit(items.map((it) => (it.id === item.id ? applyTechnique(it, t) : it)))
      }
      onRemove={() => commit(removeItem(items, item.id))}
    />
  )

  return (
    <div ref={setNodeRef} className={styles.dropZone} data-over={isOver || undefined}>
      {items.length === 0 ? (
        <p className={styles.emptyRoutine}>
          Añade ejercicios desde la biblioteca. Podrás ajustar series, repeticiones, descanso y la
          técnica de cada uno.
        </p>
      ) : (
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ol className={styles.blocks}>
            {blocks.map((block, b) => {
              const last = block.items.at(-1)!
              const isLastBlock = b === blocks.length - 1
              return (
                <li key={block.groupId ?? last.id} className={styles.blockWrap}>
                  {block.groupId ? (
                    <SupersetBlock block={block} items={items} commit={commit}>
                      {block.items.map((item) => card(item, true))}
                    </SupersetBlock>
                  ) : (
                    <ul className={styles.single}>{card(last, false)}</ul>
                  )}
                  {!isLastBlock && (
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => commit(linkWithNext(items, last.id))}
                    >
                      <Icon name="link" size={16} />
                      {block.groupId
                        ? 'Añadir el siguiente a la superserie'
                        : 'Hacer superserie con el siguiente'}
                    </button>
                  )}
                </li>
              )
            })}
          </ol>
        </SortableContext>
      )}
    </div>
  )
}

function SupersetBlock({
  block,
  items,
  commit,
  children,
}: {
  block: Block
  items: RoutineItem[]
  commit: (items: RoutineItem[]) => void
  children: React.ReactNode
}) {
  const first = block.items[0]!
  const groupId = block.groupId!
  return (
    <div className={styles.superset}>
      <div className={styles.supersetHead}>
        <span className={styles.supersetTitle}>Superserie</span>
        <span className={styles.supersetHint}>
          Sin descanso entre ejercicios; descansa al terminar cada ronda.
        </span>
      </div>
      <div className={styles.supersetControls}>
        <div className={styles.field}>
          <span className={styles.fieldLabel} aria-hidden="true">
            Rondas
          </span>
          <Stepper
            label="Rondas de la superserie"
            value={first.sets}
            min={LIMITS.sets.min}
            max={LIMITS.sets.max}
            onChange={(sets) => commit(updateGroup(items, groupId, { sets }))}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel} aria-hidden="true">
            Descanso tras la ronda
          </span>
          <Stepper
            label="Descanso tras la ronda en segundos"
            value={first.restSec}
            step={LIMITS.restSec.step}
            min={LIMITS.restSec.min}
            max={LIMITS.restSec.max}
            unit="s"
            onChange={(restSec) => commit(updateGroup(items, groupId, { restSec }))}
          />
        </div>
      </div>
      <ul className={styles.supersetItems}>{children}</ul>
      <div className={styles.supersetFoot}>
        {block.items.map((item) => (
          <UnlinkButton key={item.id} item={item} items={items} commit={commit} />
        ))}
      </div>
    </div>
  )
}

function UnlinkButton({
  item,
  items,
  commit,
}: {
  item: RoutineItem
  items: RoutineItem[]
  commit: (i: RoutineItem[]) => void
}) {
  const exercise = useExercise(item.exerciseId)
  return (
    <button
      type="button"
      className={styles.linkButton}
      onClick={() => commit(unlink(items, item.id))}
    >
      <Icon name="unlink" size={16} />
      Sacar {exercise?.nameEs ?? 'ejercicio'}
    </button>
  )
}

function DragPreview({ exerciseId }: { exerciseId: string }) {
  const exercise = useExercise(exerciseId)
  return (
    <div className={styles.dragPreview}>
      <ExerciseThumb src={exercise?.image ?? ''} />
      <span>{exercise?.nameEs}</span>
    </div>
  )
}
