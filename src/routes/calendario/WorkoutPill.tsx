import { useDraggable } from '@dnd-kit/core'
import { Icon } from '@/components/ui'
import type { CalendarEntry } from '@/db/queries'
import { LIVE_SESSION, PLANNED_DRAG_PREFIX, STATUS_META } from './status'
import styles from './Calendario.module.css'

type Props = {
  /** A planned workout, or a session done without a plan (`session`). */
  workout: CalendarEntry
  /** Compact: month cells (icon + name only, status in the accessible name). */
  compact?: boolean
  draggable?: boolean
  /** Click on a draggable pill (it covers the day button). */
  onOpen?: () => void
}

export function WorkoutPill({ workout, compact = false, draggable = false, onOpen }: Props) {
  const status = workout.session?.live ? LIVE_SESSION : STATUS_META[workout.status]
  // Done workouts and sessions stay on their day: only planned ones move.
  const movable = draggable && workout.status !== 'done' && !workout.session
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${PLANNED_DRAG_PREFIX}${workout.id}`,
    disabled: !movable,
  })

  return (
    <span
      ref={setNodeRef}
      className={styles.pill}
      data-status={workout.session?.live ? 'live' : workout.status}
      data-compact={compact || undefined}
      data-dragging={isDragging || undefined}
      {...(movable
        ? {
            ...attributes,
            ...listeners,
            'aria-roledescription': 'entreno arrastrable',
            onClick: onOpen,
          }
        : {})}
    >
      <Icon name={status.icon} size={compact ? 14 : 16} className={styles.pillIcon} />
      <span className={styles.pillName}>{workout.routineName}</span>
      {compact ? (
        <span className="visually-hidden">, {status.label}</span>
      ) : (
        <span className={styles.pillStatus}>
          {status.label}
          {workout.minutes > 0 && workout.status === 'planned' && (
            <span className="num"> · ≈ {workout.minutes} min</span>
          )}
          {workout.session && workout.minutes > 0 && (
            <span className="num"> · {workout.minutes} min</span>
          )}
        </span>
      )}
    </span>
  )
}
