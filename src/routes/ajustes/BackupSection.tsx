import { differenceInCalendarDays } from 'date-fns'
import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { Button, Sheet, showToast } from '@/components/ui'
import {
  applyImport,
  BACKUP_TABLE_LABELS,
  backupFileName,
  createBackup,
  lastExportAt,
  markExported,
  parseBackup,
  planImport,
  type Backup,
  type ImportPlanRow,
} from '@/db/backup'
import { formatDay, toDateKey } from '@/lib/dates'
import { requestSync } from '@/sync'
import styles from './AjustesPage.module.css'

/** After this many days without a copy, Ajustes says so (informative only). */
const REMIND_AFTER_DAYS = 30

const count = (n: number) => new Intl.NumberFormat('es-ES').format(n)

/** Export everything to a JSON file and import it back (merged, never duplicated). */
export function BackupSection() {
  const lastExport = useLiveQuery(lastExportAt)
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ backup: Backup; plan: ImportPlanRow[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const exportData = async () => {
    const backup = await createBackup()
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 1)], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = backupFileName(backup)
    a.click()
    URL.revokeObjectURL(url)
    await markExported(backup.exportedAt)
    showToast({ message: 'Copia descargada' })
  }

  const readFile = async (file: File) => {
    setError(null)
    try {
      const backup = parseBackup(JSON.parse(await file.text()))
      setPending({ backup, plan: await planImport(backup) })
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? 'El archivo no es un JSON válido.'
          : e instanceof Error
            ? e.message
            : 'No se ha podido leer el archivo.',
      )
    }
  }

  const confirmImport = async () => {
    if (!pending) return
    const result = await applyImport(pending.backup)
    setPending(null)
    const written = result.reduce((n, r) => n + r.added + r.updated, 0)
    showToast({
      message: written
        ? `Importados ${count(written)} registros`
        : 'No había nada nuevo que importar',
    })
    void requestSync()
  }

  const toWrite = pending?.plan.reduce((n, r) => n + r.added + r.updated, 0) ?? 0

  return (
    <section className={styles.section} aria-labelledby="ajustes-copia">
      <h2 id="ajustes-copia" className={styles.label}>
        Copia de seguridad
      </h2>
      <p className={styles.hint}>
        Descarga todos tus datos en un archivo (rutinas, calendario, sesiones, series, peso y
        medidas). Al importarlo se fusiona con lo que ya tienes: nada se duplica y, si un registro
        está en los dos sitios, gana la versión más reciente.
      </p>
      <div className={styles.actions}>
        <Button icon="copy" onClick={() => void exportData()}>
          Exportar datos
        </Button>
        <Button variant="ghost" onClick={() => fileInput.current?.click()}>
          Importar datos
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void readFile(file)
          }}
        />
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <LastExport at={lastExport} />

      <Sheet open={pending !== null} onClose={() => setPending(null)} title="Importar datos">
        {pending && (
          <div className={styles.stack}>
            <p className={styles.hint}>
              Copia del{' '}
              {formatDay(toDateKey(new Date(pending.backup.exportedAt)), "d 'de' MMMM 'de' yyyy")}.
            </p>
            <dl className={styles.facts}>
              {pending.plan
                .filter((r) => r.added + r.updated + r.unchanged > 0)
                .map((r) => (
                  <div key={r.table}>
                    <dt>{BACKUP_TABLE_LABELS[r.table]}</dt>
                    <dd className="num">
                      {r.added + r.updated
                        ? `${count(r.added)} nuevos · ${count(r.updated)} actualizados`
                        : 'sin cambios'}
                    </dd>
                  </div>
                ))}
            </dl>
            {toWrite === 0 ? (
              <p>Ya tienes todo lo que hay en esta copia.</p>
            ) : (
              <Button variant="primary" size="lg" block onClick={() => void confirmImport()}>
                Importar {count(toWrite)} registros
              </Button>
            )}
            <Button block onClick={() => setPending(null)}>
              {toWrite === 0 ? 'Entendido' : 'Cancelar'}
            </Button>
          </div>
        )}
      </Sheet>
    </section>
  )
}

function LastExport({ at }: { at: string | null | undefined }) {
  if (at === undefined) return null
  if (at === null) return <p className={styles.hint}>Aún no has hecho ninguna copia.</p>
  const days = differenceInCalendarDays(new Date(), new Date(at))
  const day = formatDay(toDateKey(new Date(at)), "d 'de' MMMM")
  return (
    <p className={styles.hint}>
      {days > REMIND_AFTER_DAYS
        ? `Tu última copia es del ${day}, hace ${days} días. Conviene hacer otra.`
        : `Última copia: ${day}.`}
    </p>
  )
}
