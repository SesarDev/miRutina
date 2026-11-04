import { useState } from 'react'
import { Button, showToast } from '@/components/ui'
import { useExercisesById, useRoutine } from '@/db/queries'
import { saveRoutine } from '@/db/routines'
import { itemsOf } from '@/db/sessions'
import type { Session, SetLog } from '@/db/types'
import { routineChanges, type RoutineChange } from '@/lib/routineChanges'
import styles from './Session.module.css'

const answeredKey = (sessionId: string) => `mirutina:routine-prompt:${sessionId}`

function readAnswered(sessionId: string) {
  try {
    return localStorage.getItem(answeredKey(sessionId)) !== null
  } catch {
    return false
  }
}

/**
 * In the summary of a routine session: if the session changed the routine (exercises added, a
 * new order, a different number of sets), offer to keep those changes in the routine. Asked once
 * per session; the answer is remembered on this device.
 */
export function RoutineChangesPrompt({ session, rows }: { session: Session; rows: SetLog[] }) {
  const routine = useRoutine(session.routineId ?? '')
  const [answered, setAnswered] = useState(() => readAnswered(session.id))
  const items = itemsOf(session)
  const names = useExercisesById(items.map((i) => i.exerciseId))

  if (!routine || routine.deletedAt || answered) return null
  const { changes, items: next } = routineChanges(routine.items, items, rows)
  if (!changes.length) return null

  const answer = (value: 'saved' | 'kept') => {
    try {
      localStorage.setItem(answeredKey(session.id), value)
    } catch {
      // Private mode: the prompt may come back next time; harmless.
    }
    setAnswered(true)
  }

  const save = async () => {
    const before = routine.items
    await saveRoutine({ id: routine.id, name: routine.name, items: next })
    answer('saved')
    showToast({
      message: `«${routine.name}» actualizada`,
      actionLabel: 'Deshacer',
      onAction: () => void saveRoutine({ id: routine.id, name: routine.name, items: before }),
    })
  }

  const text = (c: RoutineChange) => {
    const name = (id: string) => names.get(id)?.nameEs ?? 'Ejercicio'
    if (c.kind === 'added') return `Añadido: ${name(c.exerciseId)}`
    if (c.kind === 'order') return 'Otro orden de los ejercicios'
    return `${name(c.exerciseId)}: ${c.to} ${c.to === 1 ? 'serie' : 'series'} (antes ${c.from})`
  }

  return (
    <section className={styles.routinePrompt} aria-labelledby="routine-prompt-title">
      <h2 id="routine-prompt-title" className={styles.lastLabel}>
        Has cambiado la rutina en esta sesión
      </h2>
      <ul className={styles.routinePromptList}>
        {changes.map((c, i) => (
          <li key={i}>{text(c)}</li>
        ))}
      </ul>
      <div className={styles.routinePromptActions}>
        <Button onClick={() => void save()}>Guardar en «{routine.name}»</Button>
        <Button variant="ghost" onClick={() => answer('kept')}>
          Solo esta vez
        </Button>
      </div>
    </section>
  )
}
