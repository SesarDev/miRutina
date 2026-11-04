import type { IconName } from '@/components/ui'
import type { PlannedStatus } from '@/db/types'

/** Each state has an icon and a word, never colour alone. */
export const STATUS_META: Record<PlannedStatus, { label: string; icon: IconName }> = {
  planned: { label: 'Planificado', icon: 'clock' },
  done: { label: 'Hecho', icon: 'check' },
  skipped: { label: 'Saltado', icon: 'skip' },
}

/** A session started and not finished yet (shown on its day like a workout). */
export const LIVE_SESSION: { label: string; icon: IconName } = { label: 'En curso', icon: 'play' }

export const ROUTINE_DRAG_PREFIX = 'routine:'
export const PLANNED_DRAG_PREFIX = 'planned:'
export const DAY_DROP_PREFIX = 'day:'
