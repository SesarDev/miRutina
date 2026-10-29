import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { Button, Card, Chip, EmptyState, IconButton, Sheet, Stepper } from '@/components/ui'
import { FEELS, type Feel } from '@/db/types'
import styles from './DevUiPage.module.css'

const SWATCHES = [
  ['Fondo', '--color-bg'],
  ['Superficie', '--color-surface'],
  ['Superficie 2', '--color-surface-2'],
  ['Texto', '--color-text'],
  ['Texto 2', '--color-text-2'],
  ['Texto 3', '--color-text-3'],
  ['Granate', '--color-band'],
  ['Oro', '--color-accent'],
  ['Error', '--color-danger'],
  ['Aviso', '--color-warning'],
  ['Correcto', '--color-success'],
  ['Info', '--color-info'],
] as const

function ThemePanel({ theme }: { theme: 'dark' | 'light' }) {
  const [weight, setWeight] = useState(60)
  const [reps, setReps] = useState(9)
  const [feel, setFeel] = useState<Feel | null>('puedo_mas')
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <section
      data-theme={theme}
      className={styles.panel}
      aria-label={`Tema ${theme === 'dark' ? 'oscuro' : 'claro'}`}
    >
      <h2 className={styles.panelTitle}>{theme === 'dark' ? 'Oscuro' : 'Claro'}</h2>

      <div className={styles.group}>
        <h3 className={styles.label}>Button</h3>
        <div className={styles.row}>
          <Button variant="primary">Serie hecha</Button>
          <Button>Secundario</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="primary" disabled>
            Desactivado
          </Button>
        </div>
        <Button variant="primary" size="lg" block icon="check">
          Serie hecha
        </Button>
      </div>

      <div className={styles.group}>
        <h3 className={styles.label}>IconButton</h3>
        <div className={styles.row}>
          <IconButton icon="close" label="Cerrar" />
          <IconButton icon="plus" label="Añadir" outlined />
          <IconButton icon="settings" label="Ajustes" size="lg" outlined />
          <IconButton icon="more" label="Más opciones" disabled />
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.label}>Stepper</h3>
        <div className={styles.steppers}>
          <Stepper
            label="Peso"
            value={weight}
            onChange={setWeight}
            step={2.5}
            decimals={1}
            unit="kg"
          />
          <Stepper
            label="Repeticiones"
            value={reps}
            onChange={setReps}
            min={1}
            max={100}
            unit="reps"
          />
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.label}>Chip · valoración</h3>
        <div className={styles.row}>
          {FEELS.map((f) => (
            <Chip
              key={f}
              feel={f}
              selected={feel === f}
              onClick={() => setFeel(feel === f ? null : f)}
            />
          ))}
        </div>
        <div className={styles.row}>
          <Chip>Pecho</Chip>
          <Chip selected>Barra</Chip>
          <Chip feel="bien" selected />
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.label}>Card · última vez y brazalete</h3>
        <Card>
          <p className={styles.label}>
            Última vez · <time>hace 4 días</time>
          </p>
          <p className={styles.lastName}>Press banca</p>
          <p className={styles.dorsal}>
            60<span className={styles.dorsalUnit}>kg</span>
          </p>
          <div className={styles.reps}>
            × 10 · 10 · 9 <Chip feel="puedo_mas" selected />
          </div>
          <p className={styles.previous}>Anterior: 57,5 kg × 10 · 10 · 10 · Bien</p>
        </Card>
        <Card>
          <ol className={styles.sets}>
            <li className={styles.set}>
              <span className={styles.setIndex}>1</span>
              <span className={styles.setNote}>Puedo más</span>
              <span className={styles.setValue}>60 × 10</span>
            </li>
            <li className={`${styles.set} ${styles.armband}`} aria-current="step">
              <span className={styles.setIndex}>2</span>
              <span className={styles.setNote}>Serie actual</span>
              <span className={styles.setValue}>60 × 9</span>
            </li>
            <li className={`${styles.set} ${styles.pending}`}>
              <span className={styles.setIndex}>3</span>
              <span className={styles.setNote} />
              <span className={styles.setValue}>60 × 9</span>
            </li>
          </ol>
        </Card>
      </div>

      <div className={styles.group}>
        <h3 className={styles.label}>Recuadro de GIF (180 × 180)</h3>
        <div className={styles.media}>GIF del dataset</div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.label}>Sheet</h3>
        <div className={styles.row}>
          <Button onClick={() => setSheetOpen(true)}>Abrir panel</Button>
        </div>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Valorar serie">
          <div className={styles.row}>
            {FEELS.map((f) => (
              <Chip key={f} feel={f} onClick={() => setSheetOpen(false)} />
            ))}
          </div>
        </Sheet>
      </div>

      <div className={styles.group}>
        <h3 className={styles.label}>EmptyState</h3>
        <EmptyState
          icon="routines"
          title="Todavía no tienes rutinas"
          description="Crea una rutina con tus ejercicios, series y reps."
          actions={<Button variant="primary">Crear una rutina</Button>}
        />
      </div>

      <div className={styles.group}>
        <h3 className={styles.label}>Tipografía</h3>
        <div className={styles.type}>
          {(
            [
              ['dorsal', 'var(--text-dorsal)', 'condensed'],
              ['3xl', 'var(--text-3xl)', 'condensed'],
              ['2xl', 'var(--text-2xl)', 'condensed'],
              ['xl', 'var(--text-xl)', 'sans'],
              ['md', 'var(--text-md)', 'sans'],
              ['xs', 'var(--text-xs)', 'sans'],
            ] as const
          ).map(([name, size, family]) => (
            <p
              key={name}
              className={styles.typeSample}
              style={{
                fontSize: size,
                fontFamily: `var(--font-${family})`,
                fontWeight: family === 'condensed' ? 700 : 400,
                lineHeight: 1.1,
              }}
            >
              <small>{name}</small>
              <span className="num">{family === 'condensed' ? '102,5' : 'Press banca 4 × 8'}</span>
            </p>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.label}>Color</h3>
        <div className={styles.swatches}>
          {SWATCHES.map(([label, token]) => (
            <div key={token} className={styles.swatch}>
              <span style={{ background: `var(${token})` }} />
              {label}
            </div>
          ))}
          {FEELS.map((f) => (
            <div key={f} className={styles.swatch}>
              <span style={{ background: `var(--feel-${f.replace('_', '-')})` }} />
              {f}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function DevUiPage() {
  return (
    <>
      <PageHeader
        title="Primitivas"
        subtitle="Página interna · /dev/ui"
        actions={<ThemeSwitcher />}
      />
      <div className={styles.themes}>
        <ThemePanel theme="dark" />
        <ThemePanel theme="light" />
      </div>
    </>
  )
}
