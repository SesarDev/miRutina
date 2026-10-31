import { Link, useRouterState } from '@tanstack/react-router'
import { Icon } from '@/components/ui'
import { formatClock, restRemaining, useNow, useRestEnd } from './clock'
import { useSessionUi, type Rest } from './sessionStore'
import styles from './RestBar.module.css'

/** Compact rest timer on every other screen while a rest runs, with a way back to the session. */
export function RestBar() {
  const rest = useSessionUi((s) => s.rest)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (!rest || pathname === `/sesion/${rest.sessionId}`) return null
  return <Bar rest={rest} />
}

function Bar({ rest }: { rest: Rest }) {
  const now = useNow(500)
  const ended = useRestEnd(rest, now)

  return (
    <Link
      to="/sesion/$sessionId"
      params={{ sessionId: rest.sessionId }}
      className={styles.bar}
      data-ended={ended || undefined}
    >
      <Icon name="clock" size={20} className={styles.icon} />
      <span className={styles.label} aria-live="polite">
        {ended ? 'Descanso terminado' : 'Descanso'}
      </span>
      <span className={`${styles.clock} num`} role="timer">
        {formatClock(restRemaining(rest, now))}
      </span>
      <span className={styles.back}>
        Volver
        <Icon name="chevronRight" size={18} />
      </span>
    </Link>
  )
}
