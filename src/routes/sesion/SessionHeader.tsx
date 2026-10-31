import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Icon } from '@/components/ui'
import type { Session } from '@/db/types'
import { formatClock, useNow } from './clock'
import styles from './Session.module.css'

function Elapsed({ startedAt }: { startedAt: string }) {
  const now = useNow()
  const sec = (now - Date.parse(startedAt)) / 1000
  return (
    <span className={`${styles.elapsed} num`}>
      <span className="visually-hidden">Tiempo de sesión </span>
      {formatClock(sec)}
    </span>
  )
}

type Props = {
  session: Session
  title: string
  /** «Terminar» (F3 paso 6). */
  action?: ReactNode
}

export function SessionHeader({ session, title, action }: Props) {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.headerBack} aria-label="Salir a Hoy (la sesión sigue abierta)">
        <Icon name="chevronLeft" size={24} />
      </Link>
      <div className={styles.headerText}>
        <h1 className={styles.headerTitle}>{title}</h1>
        <Elapsed startedAt={session.startedAt} />
      </div>
      {action}
    </header>
  )
}
