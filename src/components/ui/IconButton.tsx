import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './IconButton.module.css'

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName
  /** Required: an icon-only control needs an accessible name. */
  label: string
  size?: 'md' | 'lg'
  outlined?: boolean
}

export function IconButton({
  icon,
  label,
  size = 'md',
  outlined = false,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classes = [
    styles.iconButton,
    size === 'lg' && styles.lg,
    outlined && styles.outlined,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size === 'lg' ? 26 : 22} />
    </button>
  )
}
