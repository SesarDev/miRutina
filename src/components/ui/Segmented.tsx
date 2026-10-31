import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'
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

/**
 * Segmented control: one option on, arrow keys move between options (roving tab index). The
 * highlight is one pill that slides to the selected option (transitions.dev «tabs sliding»).
 */
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
  const pill = useRef<HTMLSpanElement>(null)
  const placed = useRef(false)
  const tabs = kind === 'tabs'
  const selected = options.findIndex((o) => o.value === value)

  // Measure the selected option and move the pill there. The first placement and every resize
  // snap without a transition; only a change of option slides.
  useLayoutEffect(() => {
    const group = ref.current
    const el = pill.current
    if (!group || !el) return
    const move = (animate: boolean) => {
      const target = group.querySelectorAll<HTMLButtonElement>('button')[selected]
      if (!target) return
      if (!animate) el.style.transition = 'none'
      el.style.transform = `translate(${target.offsetLeft}px, ${target.offsetTop}px)`
      el.style.width = `${target.offsetWidth}px`
      el.style.height = `${target.offsetHeight}px`
      if (!animate) {
        void el.offsetWidth
        el.style.transition = ''
      }
    }
    move(placed.current)
    placed.current = true
    const observer = new ResizeObserver(() => move(false))
    observer.observe(group)
    return () => observer.disconnect()
  }, [selected])

  const onKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    const edge = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : null
    if (step === undefined && edge === null) return
    e.preventDefault()
    const next = edge ?? (selected + step! + options.length) % options.length
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
      <span ref={pill} className={styles.pill} aria-hidden="true" />
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
