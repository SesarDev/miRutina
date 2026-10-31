import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/components/ui'
import { useNumberPop } from '@/motion/useNumberPop'
import { clamp, parseDecimal, roundTo } from '@/lib/numbers'
import styles from './Session.module.css'

type Props = {
  /** Visible label, e.g. «kg» or «reps». */
  label: string
  /** Accessible name, e.g. «Peso». */
  name: string
  value: number | null
  onChange: (value: number) => void
  step: number
  decimals?: number
  max?: number
  /** Shown when there is no value (target reps). */
  placeholder?: string
  /** Called before the first change (closes the feel prompt and starts the rest). */
  onEdit?: () => void
}

const HOLD_DELAY_MS = 400
const HOLD_EVERY_MS = 90

/**
 * Big stepper of the session: 56 px ends, holding repeats, and the figure opens the numeric
 * keyboard. It may be empty (no history): + starts from one step, − from zero.
 */
export function SessionStepper({
  label,
  name,
  value,
  onChange,
  step,
  decimals = 0,
  max = 999,
  placeholder = '—',
  onEdit,
}: Props) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  useNumberPop(input, value)
  const format = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: decimals,
    useGrouping: false,
  })
  const clean = (n: number) => clamp(roundTo(n, decimals), 0, max)
  const stepText = format.format(step)

  return (
    <div className={styles.stepper} role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className={styles.stepperLabel}>
        {label}
      </span>
      <div className={styles.stepperControl}>
        <HoldButton
          label={`Restar ${stepText} ${label}`}
          icon="minus"
          disabled={value !== null && value <= 0}
          value={value}
          next={(v) => clean((v ?? 0) - step)}
          onStart={onEdit}
          onChange={onChange}
        />
        <input
          ref={input}
          className={`${styles.stepperInput} num`}
          aria-label={name}
          inputMode={decimals > 0 ? 'decimal' : 'numeric'}
          enterKeyHint="done"
          autoComplete="off"
          placeholder={placeholder}
          value={draft ?? (value === null ? '' : format.format(value))}
          onFocus={(e) => {
            onEdit?.()
            e.currentTarget.select()
          }}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ''))}
          onBlur={() => {
            const parsed = draft === null ? null : parseDecimal(draft)
            if (parsed !== null) onChange(clean(parsed))
            setDraft(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />
        <HoldButton
          label={`Sumar ${stepText} ${label}`}
          icon="plus"
          disabled={value !== null && value >= max}
          value={value}
          next={(v) => clean((v ?? 0) + step)}
          onStart={onEdit}
          onChange={onChange}
        />
      </div>
    </div>
  )
}

/** A +/− end: one change per tap, repeating while held. Keyboard clicks change once. */
function HoldButton({
  label,
  icon,
  disabled,
  value,
  next,
  onStart,
  onChange,
}: {
  label: string
  icon: 'plus' | 'minus'
  disabled: boolean
  value: number | null
  next: (value: number | null) => number
  onStart?: () => void
  onChange: (value: number) => void
}) {
  // Latest value while holding: the parent re-renders after each change, but a held repeat
  // must not wait for it.
  const latest = useRef(value)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    latest.current = value
  }, [value])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const change = () => {
    const v = next(latest.current)
    latest.current = v
    onChange(v)
  }
  const stop = () => window.clearTimeout(timer.current)

  return (
    <button
      type="button"
      className={styles.stepperButton}
      aria-label={label}
      disabled={disabled}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.preventDefault()
        onStart?.()
        change()
        const repeat = () => {
          change()
          timer.current = window.setTimeout(repeat, HOLD_EVERY_MS)
        }
        timer.current = window.setTimeout(repeat, HOLD_DELAY_MS)
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onClick={(e) => {
        // Pointer taps were handled on pointerdown; this is the keyboard / assistive path.
        if (e.detail !== 0) return
        onStart?.()
        change()
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Icon name={icon} size={28} />
    </button>
  )
}
