import { useRef, type KeyboardEvent } from 'react'
import styles from './Segmented.module.css'

type Option<T extends string> = { value: T; label: string }

type SegmentedProps<T extends string> = {
  /** Accessible name of the group. */
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  /**
   * 'radio' for a choice that filters what is shown; 'tabs' for panels, with `idPrefix` so each
   * tab is `${idPrefix}-tab-${value}` and controls `${idPrefix}-panel`.
   */
  kind?: 'radio' | 'tabs'
  idPrefix?: string
  size?: 'md' | 'sm'
  className?: string
}

/** Segmented control: one option on, arrow keys move between options (roving tab index). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  kind = 'radio',
  idPrefix,
  size = 'md',
  className,
}: SegmentedProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const tabs = kind === 'tabs'

  const onKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    const edge = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : null
    if (step === undefined && edge === null) return
    e.preventDefault()
    const current = options.findIndex((o) => o.value === value)
    const next = edge ?? (current + step! + options.length) % options.length
    onChange(options[next]!.value)
    ref.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }

  return (
    <div
      ref={ref}
      role={tabs ? 'tablist' : 'radiogroup'}
      aria-label={label}
      className={[styles.group, size === 'sm' && styles.sm, className].filter(Boolean).join(' ')}
      onKeyDown={onKeyDown}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role={tabs ? 'tab' : 'radio'}
            id={tabs ? `${idPrefix}-tab-${o.value}` : undefined}
            aria-controls={tabs ? `${idPrefix}-panel` : undefined}
            {...(tabs ? { 'aria-selected': on } : { 'aria-checked': on })}
            tabIndex={on ? 0 : -1}
            className={styles.option}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
