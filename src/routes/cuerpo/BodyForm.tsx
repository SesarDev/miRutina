import { useState, type FormEvent } from 'react'
import { Button, showToast, TextField } from '@/components/ui'
import { deleteBodyMetric, restoreBodyMetric, saveBodyMetric } from '@/db/body'
import type { BodyMetric } from '@/db/types'
import { BODY_FIELDS, parseBodyValue, type BodyField } from '@/lib/body'
import { formatDay, isValidDateKey, todayKey, type DateKey } from '@/lib/dates'
import { formatWeight } from '@/lib/numbers'
import styles from './Cuerpo.module.css'

type Values = Record<BodyField, string>

const toValues = (m?: BodyMetric): Values =>
  Object.fromEntries(
    BODY_FIELDS.map(({ key }) => [key, m?.[key] != null ? formatWeight(m[key]!) : '']),
  ) as Values

type Props = {
  /** The record to edit; undefined = new record (today by default). */
  initial?: BodyMetric
  /** All records, to switch to the one of a date when that date is chosen. */
  metrics: BodyMetric[]
  onDone: () => void
}

/** One record per date: choosing a date that already has one edits that record. */
export function BodyForm({ initial, metrics, onDone }: Props) {
  // A new record starts on today; if today already has one, that one is edited.
  const [start] = useState(() => initial ?? metrics.find((m) => m.date === todayKey()))
  const [editing, setEditing] = useState<BodyMetric | undefined>(start)
  const [date, setDate] = useState<DateKey>(start?.date ?? todayKey())
  const [values, setValues] = useState<Values>(() => toValues(start))
  const [notes, setNotes] = useState(start?.notes ?? '')
  const [errors, setErrors] = useState<Partial<Record<BodyField | 'form', string>>>({})

  const changeDate = (next: string) => {
    setDate(next)
    const existing = metrics.find((m) => m.date === next)
    if (existing && existing.id !== editing?.id) {
      setEditing(existing)
      setValues(toValues(existing))
      setNotes(existing.notes ?? '')
      setErrors({})
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = BODY_FIELDS.map(({ key }) => [key, parseBodyValue(key, values[key])] as const)
    const next: typeof errors = {}
    for (const [key, { error }] of parsed) if (error) next[key] = error
    if (!isValidDateKey(date)) next.form = 'Elige una fecha.'
    else if (date > todayKey()) next.form = 'La fecha no puede ser futura.'
    else if (parsed.every(([, p]) => p.value === null) && !notes.trim() && !next.form) {
      next.form = 'Apunta al menos el peso o una medida.'
    }
    setErrors(next)
    if (Object.keys(next).length) return

    await saveBodyMetric({
      id: editing?.id,
      date,
      ...(Object.fromEntries(parsed.map(([key, p]) => [key, p.value])) as Record<
        BodyField,
        number | null
      >),
      notes: notes.trim() || null,
    })
    onDone()
  }

  const remove = async () => {
    if (!editing) return
    const { id, date: day } = editing
    await deleteBodyMetric(id)
    onDone()
    showToast({
      message: `Registro del ${formatDay(day, "d 'de' MMMM")} borrado`,
      actionLabel: 'Deshacer',
      onAction: () => void restoreBodyMetric(id),
    })
  }

  return (
    <form className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
      <TextField
        label="Fecha"
        type="date"
        value={date}
        max={todayKey()}
        onChange={(e) => changeDate(e.target.value)}
        hint={
          editing && editing.id !== initial?.id
            ? 'Ya tenías un registro ese día: lo editas.'
            : undefined
        }
      />
      <div className={styles.fields}>
        {BODY_FIELDS.map(({ key, label, unit }) => (
          <TextField
            key={key}
            label={`${label} (${unit})`}
            inputMode="decimal"
            autoComplete="off"
            value={values[key]}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            error={errors[key]}
            className={key === 'bodyweight' ? styles.wide : undefined}
          />
        ))}
      </div>
      <TextField
        label="Notas"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Opcional"
      />
      {errors.form && (
        <p className={styles.formError} role="alert">
          {errors.form}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" block>
        Guardar
      </Button>
      {editing && (
        <Button type="button" variant="ghost" icon="trash" block onClick={() => void remove()}>
          Borrar registro
        </Button>
      )}
    </form>
  )
}
