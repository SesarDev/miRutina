import { getRouteApi, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { PageHeader } from '@/components/PageHeader'
import { buttonClassName, EmptyState } from '@/components/ui'
import { useRoutine, useSession } from '@/db/queries'
import { DATE_OPTIONS } from '@/lib/dates'

const route = getRouteApi('/sesion/$sessionId')

/** Placeholder until F3 builds the session screen. */
export function SesionPage() {
  const { sessionId } = route.useParams()
  const session = useSession(sessionId)
  const routine = useRoutine(session?.routineId ?? '')

  if (session === undefined) return null
  if (!session || session.deletedAt) {
    return (
      <>
        <PageHeader title="Sesión" />
        <EmptyState
          icon="today"
          title="Esta sesión no existe"
          description="Puede que se borrara o que el enlace esté incompleto. Empieza un entreno desde Hoy."
          actions={
            <Link to="/" className={buttonClassName({ variant: 'primary' })}>
              Ir a Hoy
            </Link>
          }
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={routine?.name ?? 'Sesión libre'}
        subtitle={`Empezada a las ${format(new Date(session.startedAt), 'HH:mm', DATE_OPTIONS)}`}
      />
      <EmptyState
        icon="today"
        title="El registro de series llega en la próxima versión"
        description="La sesión ya está guardada y enlazada al calendario. Pronto podrás registrar aquí cada serie con su peso, sus repeticiones y cómo te sentiste."
        actions={
          <Link to="/" className={buttonClassName({ variant: 'secondary' })}>
            Volver a Hoy
          </Link>
        }
      />
    </>
  )
}
