import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button, IconButton, Sheet, showToast } from '@/components/ui'
import { discardSession, startSession } from '@/db/sessions'
import type { Session, SetLog } from '@/db/types'
import { StartList } from '@/routes/hoy/StartList'
import { resetSessionUi } from './sessionStore'
import styles from './Session.module.css'

type View = 'menu' | 'cancel' | 'change'

/**
 * «⋯» in the session header: cancel a workout started by mistake, or swap it for another
 * routine. Both discard this session (and its marked sets) with an undo.
 */
export function SessionMenu({ session, rows }: { session: Session; rows: SetLog[] }) {
  const navigate = useNavigate()
  const [view, setView] = useState<View | null>(null)
  const marked = rows.filter((r) => r.completedAt && !r.isWarmup).length
  const lost =
    marked === 0
      ? 'No has marcado ninguna serie.'
      : marked === 1
        ? 'Se borrará la serie que has marcado.'
        : `Se borrarán las ${marked} series que has marcado.`

  const close = () => setView(null)

  const cancel = async () => {
    close()
    const undo = await discardSession(session.id)
    resetSessionUi()
    void navigate({ to: '/' })
    showToast({
      message: 'Entreno cancelado',
      actionLabel: 'Deshacer',
      onAction: () =>
        void undo().then(() =>
          navigate({ to: '/sesion/$sessionId', params: { sessionId: session.id } }),
        ),
    })
  }

  const change = async (routineId: string | null) => {
    close()
    const undo = await discardSession(session.id)
    resetSessionUi()
    const next = await startSession({ routineId })
    void navigate({ to: '/sesion/$sessionId', params: { sessionId: next.id }, replace: true })
    showToast({
      message: 'Entreno cambiado',
      actionLabel: 'Deshacer',
      onAction: () =>
        void discardSession(next.id)
          .then(undo)
          .then(() =>
            navigate({
              to: '/sesion/$sessionId',
              params: { sessionId: session.id },
              replace: true,
            }),
          ),
    })
  }

  return (
    <>
      <IconButton
        icon="more"
        label="Opciones del entreno"
        className={styles.headerMenu}
        onClick={() => setView('menu')}
      />
      <Sheet
        open={view !== null}
        onClose={close}
        title={
          view === 'change'
            ? 'Cambiar de rutina'
            : view === 'cancel'
              ? '¿Cancelar el entreno?'
              : 'Opciones del entreno'
        }
      >
        <div className={styles.finishSheet}>
          {view === 'menu' && (
            <>
              <Button block size="lg" icon="routines" onClick={() => setView('change')}>
                Cambiar de rutina
              </Button>
              <Button
                block
                size="lg"
                variant="danger"
                icon="trash"
                onClick={() => setView('cancel')}
              >
                Cancelar entreno
              </Button>
              <p className={styles.menuHint}>
                Para cuando empiezas una rutina por error. El entreno del calendario vuelve a quedar
                pendiente.
              </p>
            </>
          )}
          {view === 'cancel' && (
            <>
              <p>
                {lost} La sesión desaparece del historial y el entreno del calendario vuelve a
                quedar pendiente.
              </p>
              <Button block size="lg" variant="danger" onClick={() => void cancel()}>
                Sí, cancelar entreno
              </Button>
              <Button block onClick={close}>
                Seguir entrenando
              </Button>
            </>
          )}
          {view === 'change' && (
            <>
              <p className={styles.menuHint}>
                {lost} La sesión actual se descarta y empiezas la que elijas.
              </p>
              <StartList exclude={session.routineId} onPick={(id) => void change(id)} />
            </>
          )}
        </div>
      </Sheet>
    </>
  )
}
