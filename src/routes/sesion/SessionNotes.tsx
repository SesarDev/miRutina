import { useEffect, useId, useRef, useState } from 'react'
import { setSessionNotes } from '@/db/sessions'
import type { Session } from '@/db/types'
import styles from './Session.module.css'

const SAVE_DELAY_MS = 400

type Props = {
  label: string
  value: string | null
  onSave: (text: string) => void
  placeholder?: string
}

/** Free text saved 400 ms after the last keystroke (and on blur), never with a button. */
export function NoteField({ label, value, onSave, placeholder }: Props) {
  const id = useId()
  const [text, setText] = useState(value ?? '')
  const timer = useRef<number | undefined>(undefined)
  const dirty = useRef(false)

  // A change from another device replaces the text unless it is being edited.
  useEffect(() => {
    if (!dirty.current) setText(value ?? '')
  }, [value])

  const flush = (next: string) => {
    window.clearTimeout(timer.current)
    dirty.current = false
    if (next !== (value ?? '')) onSave(next)
  }

  return (
    <div className={styles.note}>
      <label htmlFor={id} className={styles.noteLabel}>
        {label}
      </label>
      <textarea
        id={id}
        className={styles.noteInput}
        rows={2}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value
          setText(next)
          dirty.current = true
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => flush(next), SAVE_DELAY_MS)
        }}
        onBlur={() => flush(text)}
      />
    </div>
  )
}

export function SessionNotes({ session }: { session: Session }) {
  return (
    <NoteField
      label="Notas de la sesión"
      value={session.notes}
      placeholder="Cómo te has encontrado, molestias, cambios…"
      onSave={(text) => void setSessionNotes(session.id, text)}
    />
  )
}
