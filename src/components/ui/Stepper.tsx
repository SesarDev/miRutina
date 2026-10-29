import { useId, useState } from 'react'
import { clamp, parseDecimal, roundTo } from '@/lib/numbers'
import { Icon } from './Icon'
import styles from './Stepper.module.css'

type StepperProps = {
  /** Accessible name, e.g. «Peso» or «Repeticiones». */
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  /** Decimal places allowed (weights: 1). */
  decimals?: number
  unit?: string
  className?: string
}

export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  decimals = 0,
  unit,
  className,
}: StepperProps) {
  const id = useId()
  const format = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: decimals,
    useGrouping: false,
  })
  // Text being typed; null when the field shows the committed value.
  const [draft, setDraft] = useState<string | null>(null)
  const unitSuffix = unit ? ` ${unit}` : ''

  const commit = (next: number) => {
    onChange(clamp(roundTo(next, decimals), min, max))
    setDraft(null)
  }

  const commitDraft = () => {
    if (draft === null) return
    const parsed = parseDecimal(draft)
    if (parsed === null) setDraft(null)
    else commit(parsed)
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.stepper} role="group" aria-labelledby={`${id}-label`}>
        <span id={`${id}-label`} className="visually-hidden">
          {label}
        </span>
        <button
          type="button"
          className={styles.button}
          aria-label={`Restar ${format.format(step)}${unitSuffix}`}
          disabled={value <= min}
          onClick={() => commit(value - step)}
        >
          <Icon name="minus" size={26} />
        </button>
        <label className={styles.value}>
          <input
            className={styles.input}
            aria-label={unit ? `${label} (${unit})` : label}
            inputMode={decimals > 0 ? 'decimal' : 'numeric'}
            enterKeyHint="done"
            autoComplete="off"
            value={draft ?? format.format(value)}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ''))}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                commit(value + step)
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                commit(value - step)
              }
            }}
          />
          {unit && <span className={styles.unit}>{unit}</span>}
        </label>
        <button
          type="button"
          className={styles.button}
          aria-label={`Sumar ${format.format(step)}${unitSuffix}`}
          disabled={value >= max}
          onClick={() => commit(value + step)}
        >
          <Icon name="plus" size={26} />
        </button>
      </div>
    </div>
  )
}
