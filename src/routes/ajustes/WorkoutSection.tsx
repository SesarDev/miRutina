import { Stepper } from '@/components/ui'
import { LIMITS } from '@/lib/routines'
import { setPrefs, usePrefs } from '@/lib/prefs'
import styles from './AjustesPage.module.css'

/** Session preferences of this device. */
export function WorkoutSection() {
  const { defaultRestSec, vibrate, wakeLock } = usePrefs()

  return (
    <section className={styles.section} aria-labelledby="ajustes-entreno">
      <h2 id="ajustes-entreno" className={styles.label}>
        Entreno
      </h2>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Descanso por defecto</span>
        <Stepper
          label="Descanso por defecto en segundos"
          value={defaultRestSec}
          step={LIMITS.restSec.step}
          min={LIMITS.restSec.min}
          max={LIMITS.restSec.max}
          unit="s"
          onChange={(value) => setPrefs({ defaultRestSec: value })}
        />
        <p className={styles.hint}>
          Para los ejercicios que añades durante la sesión. Los de una rutina usan el suyo.
        </p>
      </div>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={vibrate}
          onChange={(e) => setPrefs({ vibrate: e.target.checked })}
        />
        <span>
          Vibrar al terminar el descanso
          <span className={styles.hint}>En Android. El iPhone no permite vibrar desde la web.</span>
        </span>
      </label>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={wakeLock}
          onChange={(e) => setPrefs({ wakeLock: e.target.checked })}
        />
        <span>
          Mantener la pantalla encendida durante la sesión
          <span className={styles.hint}>Gasta algo más de batería.</span>
        </span>
      </label>
      <p className={styles.hint}>Estos ajustes son de este dispositivo.</p>
    </section>
  )
}
