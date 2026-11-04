import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button, buttonClassName, Icon, IconButton, Segmented, showToast } from '@/components/ui'
import { useCalendarEntries, useRoutines, type CalendarEntry } from '@/db/queries'
import { moveWorkout, planWorkout } from '@/db/planning'
import type { Routine } from '@/db/types'
import {
  addMonthsKey,
  addWeeksKey,
  formatDay,
  formatMonth,
  formatWeekRange,
  monthGrid,
  todayKey,
  WEEKDAY_INITIALS,
  weekDays,
  type DateKey,
} from '@/lib/dates'
import { estimateMinutes } from '@/lib/routines'
import { dndAccessibility } from '@/lib/dndA11y'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/useMediaQuery'
import { capture, play, type FlipCapture } from '@/motion/flip'
import { useGSAP } from '@/motion/gsap'
import { DaySheet } from './DaySheet'
import { DAY_DROP_PREFIX, PLANNED_DRAG_PREFIX, ROUTINE_DRAG_PREFIX } from './status'
import { WorkoutPill } from './WorkoutPill'
import styles from './Calendario.module.css'

const route = getRouteApi('/calendario')

const VIEW_OPTIONS = [
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
] as const
const MAX_PILLS = 2

export type CalendarView = 'semana' | 'mes'

export function CalendarioPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const view: CalendarView = search.vista ?? (desktop ? 'mes' : 'semana')
  const anchor = search.fecha ?? todayKey()
  const [openDay, setOpenDay] = useState<DateKey | null>(null)
  const [dragLabel, setDragLabel] = useState<string | null>(null)

  // Semana ↔ mes: the days on screen in both views travel to their new cell (GSAP Flip); the
  // rest of the month fades in around them.
  const viewsRef = useRef<HTMLDivElement>(null)
  const viewFlip = useRef<FlipCapture | null>(null)
  const dayCells = () => viewsRef.current?.querySelectorAll('[data-flip-id]') ?? []
  const changeView = (vista: CalendarView) => {
    viewFlip.current = capture(dayCells())
    go({ vista })
  }
  useGSAP(
    () => {
      play(viewFlip.current, dayCells(), { absolute: true, nested: true })
      viewFlip.current = null
    },
    { dependencies: [view], scope: viewsRef },
  )

  const days =
    view === 'semana'
      ? weekDays(anchor)
      : monthGrid(anchor)
          .flat()
          .map((d) => d.key)
  // Planned workouts and the sessions done without a plan (they are not «Descanso»).
  const planned = useCalendarEntries(days[0]!, days.at(-1)!) ?? []
  const byDay = new Map<DateKey, CalendarEntry[]>()
  for (const p of planned) byDay.set(p.date, [...(byDay.get(p.date) ?? []), p])

  const go = (patch: { vista?: CalendarView; fecha?: DateKey }) =>
    void navigate({ to: '/calendario', search: { ...search, ...patch }, replace: true })

  const step = (dir: 1 | -1) =>
    go({ fecha: view === 'semana' ? addWeeksKey(anchor, dir) : addMonthsKey(anchor, dir) })

  // ── Drag and drop (desktop): routines from the panel onto days; workouts between days ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setDragLabel(null)
    const target = over ? String(over.id) : ''
    if (!target.startsWith(DAY_DROP_PREFIX)) return
    const day = target.slice(DAY_DROP_PREFIX.length)
    const id = String(active.id)
    if (id.startsWith(ROUTINE_DRAG_PREFIX)) {
      const routineId = id.slice(ROUTINE_DRAG_PREFIX.length)
      const name = String(active.data.current?.name ?? 'Rutina')
      await planWorkout(day, routineId)
      showToast({
        message: `«${name}» el ${formatDay(day, 'EEEE d')}`,
        actionLabel: 'Repetir 4 semanas',
        // The day itself is already planned: add the next three weeks.
        onAction: () => void planWorkout(addWeeksKey(day, 1), routineId, 3),
        durationMs: 6000,
      })
      return
    }
    if (id.startsWith(PLANNED_DRAG_PREFIX)) {
      const workoutId = id.slice(PLANNED_DRAG_PREFIX.length)
      const workout = planned.find((p) => p.id === workoutId)
      if (workout && workout.date !== day) {
        await moveWorkout(workoutId, day)
        showToast({
          message: `Movido al ${formatDay(day, 'EEEE d')}`,
          actionLabel: 'Deshacer',
          onAction: () => void moveWorkout(workoutId, workout.date),
        })
      }
    }
  }

  const routines = useRoutines()
  const nameOf = (id: string | number) => {
    const key = String(id)
    if (key.startsWith(DAY_DROP_PREFIX))
      return formatDay(key.slice(DAY_DROP_PREFIX.length), "EEEE d 'de' MMMM")
    if (key.startsWith(ROUTINE_DRAG_PREFIX))
      return (
        routines?.find((r) => r.id === key.slice(ROUTINE_DRAG_PREFIX.length))?.name ?? 'la rutina'
      )
    if (key.startsWith(PLANNED_DRAG_PREFIX))
      return (
        planned.find((p) => p.id === key.slice(PLANNED_DRAG_PREFIX.length))?.routineName ??
        'el entreno'
      )
    return 'el elemento'
  }

  const title = view === 'semana' ? formatWeekRange(anchor) : formatMonth(anchor)

  const calendar = (
    <div className={styles.calendar}>
      <div className={styles.toolbar}>
        <h2 className={styles.period} aria-live="polite">
          {title}
        </h2>
        <div className={styles.nav}>
          <IconButton
            icon="chevronLeft"
            label={view === 'semana' ? 'Semana anterior' : 'Mes anterior'}
            onClick={() => step(-1)}
          />
          <Button variant="secondary" onClick={() => go({ fecha: undefined })}>
            Hoy
          </Button>
          <IconButton
            icon="chevronRight"
            label={view === 'semana' ? 'Semana siguiente' : 'Mes siguiente'}
            onClick={() => step(1)}
          />
        </div>
        <Segmented label="Vista" options={VIEW_OPTIONS} value={view} onChange={changeView} />
      </div>

      <div ref={viewsRef}>
        {view === 'semana' ? (
          <WeekView days={days} byDay={byDay} onOpen={setOpenDay} draggable={desktop} />
        ) : (
          <MonthView anchor={anchor} byDay={byDay} onOpen={setOpenDay} draggable={desktop} />
        )}
      </div>
    </div>
  )

  return (
    <>
      <PageHeader title="Calendario" />
      {desktop ? (
        <DndContext
          sensors={sensors}
          accessibility={dndAccessibility(nameOf)}
          collisionDetection={pointerWithin}
          onDragStart={(e) => setDragLabel(String(e.active.data.current?.name ?? ''))}
          onDragEnd={(e) => void onDragEnd(e)}
          onDragCancel={() => setDragLabel(null)}
        >
          <div className={styles.columns}>
            <RoutinesPanel />
            {calendar}
          </div>
          <DragOverlay dropAnimation={null}>
            {dragLabel ? <div className={styles.dragPreview}>{dragLabel}</div> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        calendar
      )}
      <DaySheet day={openDay} onClose={() => setOpenDay(null)} />
    </>
  )
}

// ── Week ──

function WeekView({
  days,
  byDay,
  onOpen,
  draggable,
}: {
  days: DateKey[]
  byDay: Map<DateKey, CalendarEntry[]>
  onOpen: (d: DateKey) => void
  draggable: boolean
}) {
  const today = todayKey()
  return (
    <ol className={styles.week}>
      {days.map((day) => (
        <DayCell
          key={day}
          day={day}
          className={styles.weekDay}
          today={day === today}
          onOpen={onOpen}
          label={formatDay(day, "EEEE d 'de' MMMM")}
        >
          <span className={styles.weekDayHead}>
            <span className={styles.weekDayName}>{formatDay(day, 'EEEE')}</span>
            <span className={`${styles.weekDayNum} num`}>{formatDay(day, 'd')}</span>
            {day === today && <span className={styles.todayTag}>Hoy</span>}
          </span>
          <span className={styles.weekWorkouts}>
            {(byDay.get(day) ?? []).map((w) => (
              <WorkoutPill
                key={w.id}
                workout={w}
                draggable={draggable}
                onOpen={() => onOpen(day)}
              />
            ))}
            {!byDay.get(day)?.length && (
              <span className={styles.restDay}>{day < today ? 'Descanso' : 'Sin planificar'}</span>
            )}
          </span>
        </DayCell>
      ))}
    </ol>
  )
}

// ── Month ──

function MonthView({
  anchor,
  byDay,
  onOpen,
  draggable,
}: {
  anchor: DateKey
  byDay: Map<DateKey, CalendarEntry[]>
  onOpen: (d: DateKey) => void
  draggable: boolean
}) {
  const today = todayKey()
  const weeks = monthGrid(anchor)
  return (
    <div className={styles.month}>
      <div className={styles.monthHead} aria-hidden="true">
        {WEEKDAY_INITIALS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <ol className={styles.monthGrid}>
        {weeks.flat().map(({ key, inMonth }) => {
          const list = byDay.get(key) ?? []
          return (
            <DayCell
              key={key}
              day={key}
              className={styles.monthDay}
              today={key === today}
              outside={!inMonth}
              onOpen={onOpen}
              label={`${formatDay(key, "EEEE d 'de' MMMM")}${list.length ? `, ${list.length} entreno${list.length > 1 ? 's' : ''}` : ''}`}
            >
              <span className={`${styles.monthNum} num`}>{formatDay(key, 'd')}</span>
              <span className={styles.monthWorkouts}>
                {list.slice(0, MAX_PILLS).map((w) => (
                  <WorkoutPill
                    key={w.id}
                    workout={w}
                    compact
                    draggable={draggable}
                    onOpen={() => onOpen(key)}
                  />
                ))}
                {list.length > MAX_PILLS && (
                  <span className={styles.more}>+{list.length - MAX_PILLS}</span>
                )}
              </span>
            </DayCell>
          )
        })}
      </ol>
    </div>
  )
}

/** A droppable day; a full-size button underneath opens the day sheet. */
function DayCell({
  day,
  className,
  today,
  outside = false,
  onOpen,
  label,
  children,
}: {
  day: DateKey
  className?: string
  today: boolean
  outside?: boolean
  onOpen: (d: DateKey) => void
  label: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${DAY_DROP_PREFIX}${day}` })
  return (
    <li
      ref={setNodeRef}
      className={className}
      data-flip-id={`day-${day}`}
      data-today={today || undefined}
      data-outside={outside || undefined}
      data-over={isOver || undefined}
    >
      <button
        type="button"
        className={styles.dayButton}
        aria-label={`${label}. Abrir el día`}
        onClick={() => onOpen(day)}
      />
      <div className={styles.dayContent}>{children}</div>
    </li>
  )
}

// ── Routines panel (desktop) ──

function RoutinesPanel() {
  const routines = useRoutines()
  return (
    <aside className={styles.panel} aria-label="Tus rutinas">
      <h2 className={styles.panelTitle}>Tus rutinas</h2>
      <p className={styles.panelHint}>Arrastra una rutina a un día para planificarla.</p>
      {routines?.length === 0 && (
        <div className={styles.noRoutines}>
          <p>Aún no tienes rutinas.</p>
          <Link to="/rutinas" search={{}} className={buttonClassName({ variant: 'primary' })}>
            Crear una rutina
          </Link>
        </div>
      )}
      <ul className={styles.panelList}>
        {routines?.map((r) => (
          <DraggableRoutine key={r.id} routine={r} />
        ))}
      </ul>
    </aside>
  )
}

function DraggableRoutine({ routine }: { routine: Routine }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${ROUTINE_DRAG_PREFIX}${routine.id}`,
    data: { name: routine.name },
  })
  return (
    <li
      ref={setNodeRef}
      className={styles.panelRoutine}
      data-dragging={isDragging || undefined}
      {...attributes}
      {...listeners}
      aria-roledescription="rutina arrastrable"
    >
      <Icon name="grip" size={18} className={styles.panelGrip} />
      <span className={styles.panelRoutineText}>
        <span className={styles.panelRoutineName}>{routine.name}</span>
        <span className={`${styles.panelRoutineMeta} num`}>
          {routine.items.length} ejercicios · ≈ {estimateMinutes(routine.items)} min
        </span>
      </span>
    </li>
  )
}
