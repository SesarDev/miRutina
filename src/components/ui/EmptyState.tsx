import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './EmptyState.module.css'

type EmptyStateProps = {
  title: string
  description: ReactNode
  icon?: IconName
  /** Buttons or links that move the user forward. */
  actions?: ReactNode
}

export function EmptyState({ title, description, icon, actions }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {icon && (
        <span className={styles.icon}>
          <Icon name={icon} size={32} />
        </span>
      )}
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
