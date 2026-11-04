import { useState } from 'react'
import { Button, Segmented, Sheet } from '@/components/ui'
import { formatWeight } from '@/lib/numbers'
import { BAR_WEIGHTS, platesPerSide } from '@/lib/plates'
import { setPrefs, usePrefs } from '@/lib/prefs'
import styles from './Session.module.css'

/** Plates go down to 1,25 kg: two decimals, unlike the one-decimal weights of the app. */
const kg = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 })

const barOptions = BAR_WEIGHTS.map((kg) => ({ value: String(kg), label: `${kg} kg` }))

/** «Discos»: how to load the bar for the weight in the stepper (the user's choice, never ours). */
export function PlatesButton({ weight }: { weight: number | null }) {
  const [open, setOpen] = useState(false)
  const bar = usePrefs((s) => s.barWeight)
  const load = weight !== null ? platesPerSide(weight, bar) : null

  return (
    <>
      <Button variant="ghost" className={styles.platesButton} onClick={() => setOpen(true)}>
        Discos
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={weight !== null ? `Discos para ${formatWeight(weight)} kg` : 'Discos'}
      >
        <div className={styles.finishSheet}>
          <Segmented
            label="Peso de la barra"
            options={barOptions}
            value={String(bar)}
            onChange={(v) => setPrefs({ barWeight: Number(v) })}
            size="sm"
          />
          {weight === null ? (
            <p>Indica el peso primero.</p>
          ) : load?.kind === 'below-bar' ? (
            <p>El peso es menor que la barra ({bar} kg).</p>
          ) : load ? (
            <>
              <p className={styles.lastLabel}>Por cada lado</p>
              {load.perSide.length ? (
                <ul className={styles.plates} aria-label="Discos por lado">
                  {load.perSide.map((p, i) => (
                    <li key={i} className={`${styles.plate} num`} data-kg={p}>
                      {kg.format(p)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Solo la barra.</p>
              )}
              <p className={styles.menuHint}>
                {kg.format(load.sideKg)} kg por lado + barra de {bar} kg
                {load.remainder > 0 &&
                  `. Con discos estándar quedan ${kg.format(load.remainder)} kg sin cubrir.`}
              </p>
            </>
          ) : null}
        </div>
      </Sheet>
    </>
  )
}
