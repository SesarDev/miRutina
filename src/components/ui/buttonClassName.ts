import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export type ButtonLookOptions = {
  variant?: ButtonVariant
  size?: 'md' | 'lg'
  block?: boolean
  className?: string
}

/** Button classes, also for links that must look like buttons (e.g. TanStack `<Link>`). */
export function buttonClassName({
  variant = 'secondary',
  size = 'md',
  block = false,
  className,
}: ButtonLookOptions = {}) {
  return [
    styles.button,
    styles[variant],
    size === 'lg' && styles.lg,
    block && styles.block,
    className,
  ]
    .filter(Boolean)
    .join(' ')
}
