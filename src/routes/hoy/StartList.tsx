import { useRoutines } from '@/db/queries'
import { estimateMinutes } from '@/lib/routines'
import styles from './StartList.module.css'

/**
 * What to train: my routines and «Sesión libre». Used by Hoy («Entrenar algo hoy») and by the
 * session's «Cambiar de rutina». `exclude` hides the routine already in progress.
 */
export function StartList({
  onPick,
  exclude,
}: {
  onPick: (routineId: string | null) => void
  exclude?: string | null
}) {
  const routines = useRoutines()
  return (
    <ul className={styles.list}>
      {routines
        ?.filter((r) => r.id !== exclude)
        .map((r) => (
          <li key={r.id}>
            <button type="button" className={styles.option} onClick={() => onPick(r.id)}>
              <span className={styles.name}>{r.name}</span>
              <span className={`${styles.meta} num`}>
                {r.items.length} ejercicios · ≈ {estimateMinutes(r.items)} min
              </span>
            </button>
          </li>
        ))}
      <li>
        <button type="button" className={styles.option} onClick={() => onPick(null)}>
          <span className={styles.name}>Sesión libre</span>
          <span className={styles.meta}>Añade los ejercicios sobre la marcha</span>
        </button>
      </li>
    </ul>
  )
}
