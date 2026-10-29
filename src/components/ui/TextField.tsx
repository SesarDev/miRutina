import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './TextField.module.css'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  /** Visually hide the label (it stays as the accessible name). */
  hideLabel?: boolean
  hint?: ReactNode
  error?: string | null
  icon?: IconName
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hideLabel = false, hint, error, icon, className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className={hideLabel ? 'visually-hidden' : styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        {icon && <Icon name={icon} size={20} className={styles.icon} />}
        <input
          ref={ref}
          id={inputId}
          className={[styles.input, icon && styles.withIcon].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          {...rest}
        />
      </div>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
