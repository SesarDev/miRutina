import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/ui'
import { useSyncSummary } from '@/sync/useSyncSummary'
import styles from './SyncIndicator.module.css'

/** Quiet sync status; links to Ajustes. Hidden while the app runs local-only. */
export function SyncIndicator({ compact = false }: { compact?: boolean }) {
  const summary = useSyncSummary()
  if (!summary.visible) return null

  const classes = [
    styles.indicator,
    compact && styles.compact,
    summary.tone === 'pending' && styles.pending,
    summary.tone === 'danger' && styles.danger,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Link to="/ajustes" className={classes} title={summary.label} aria-live="polite">
      <Icon
        name={summary.icon}
        size={20}
        className={summary.icon === 'sync' ? styles.spin : undefined}
      />
      <span className={styles.label}>{summary.label}</span>
    </Link>
  )
}
