import { Button } from '@/components/ui'
import { formatClock, restRemaining, useNow, useRestEnd } from './clock'
import { adjustRest, skipRest, type Rest } from './sessionStore'
import styles from './Session.module.css'

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function RestTimer({ rest }: { rest: Rest }) {
  const now = useNow(250)
  const ended = useRestEnd(rest, now)
  const left = restRemaining(rest, now)
  const progress = Math.min(1, left / rest.totalSec)

  return (
    <div className={styles.rest} data-ended={ended || undefined} role="timer" aria-label="Descanso">
      <svg className={styles.restRing} viewBox="0 0 64 64" aria-hidden="true">
        <circle className={styles.restTrack} cx="32" cy="32" r={RADIUS} />
        <circle
          className={styles.restProgress}
          cx="32"
          cy="32"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <div className={styles.restText}>
        <span className={styles.restLabel} aria-live="polite">
          {ended ? 'Descanso terminado' : 'Descanso'}
        </span>
        <span className={`${styles.restClock} num`}>{formatClock(left)}</span>
      </div>
      {!ended && (
        <div className={styles.restActions}>
          <Button aria-label="Restar 15 segundos" onClick={() => adjustRest(-15)}>
            −15
          </Button>
          <Button aria-label="Sumar 15 segundos" onClick={() => adjustRest(15)}>
            +15
          </Button>
          <Button variant="ghost" onClick={skipRest}>
            Saltar
          </Button>
        </div>
      )}
    </div>
  )
}
