import { Stepper } from '@/components/ui'
import { LIMITS } from '@/lib/routines'
import { playCountdownTick, playRestEnd, unlockAudio } from '@/lib/beep'
import { setPrefs, usePrefs } from '@/lib/prefs'
import styles from './AjustesPage.module.css'

/** Session preferences of this device. */
export function WorkoutSection() {
  const { defaultRestSec, vibrate, wakeLock, sound, countdownBeeps } = usePrefs()

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
          checked={sound}
          onChange={(e) => {
            unlockAudio()
            setPrefs({ sound: e.target.checked })
            if (e.target.checked) playRestEnd()
          }}
        />
        <span>
          Sonido al terminar el descanso
          <span className={styles.hint}>
            Con la app abierta. En iPhone no suena con el interruptor de silencio.
          </span>
        </span>
      </label>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={countdownBeeps}
          disabled={!sound}
          onChange={(e) => {
            unlockAudio()
            setPrefs({ countdownBeeps: e.target.checked })
            if (e.target.checked) playCountdownTick()
          }}
        />
        <span>
          Pitidos en los últimos 3 segundos
          <span className={styles.hint}>Un aviso corto por segundo antes del final.</span>
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
