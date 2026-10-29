import type { ButtonHTMLAttributes } from 'react'
import { buttonClassName, type ButtonLookOptions } from './buttonClassName'
import { Icon, type IconName } from './Icon'
import styles from './Button.module.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonLookOptions & {
    icon?: IconName
  }

export function Button({
  variant,
  size,
  block,
  icon,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClassName({ variant, size, block, className })} {...rest}>
      {icon && <Icon name={icon} size={20} className={styles.icon} />}
      {children}
    </button>
  )
}
