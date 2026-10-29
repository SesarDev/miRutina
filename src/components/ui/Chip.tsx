import type { ReactNode } from 'react'
import { FEEL_LABELS, type Feel } from '@/lib/feel'
import styles from './Chip.module.css'

type ChipProps = {
  children?: ReactNode
  /** Feel colour; the label defaults to the feel's name, so colour never travels alone. */
  feel?: Feel
  selected?: boolean
  /** When set, the chip renders as a toggle button. */
  onClick?: () => void
  className?: string
}

export function Chip({ children, feel, selected = false, onClick, className }: ChipProps) {
  const classes = [styles.chip, feel ? styles[feel] : styles.neutral, className]
  const content = children ?? (feel ? FEEL_LABELS[feel] : null)

  if (onClick) {
    return (
      <button
        type="button"
        className={classes.filter(Boolean).join(' ')}
        aria-pressed={selected}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <span className={[...classes, selected && styles.selected].filter(Boolean).join(' ')}>
      {content}
    </span>
  )
}
