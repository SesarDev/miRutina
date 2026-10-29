import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { buttonClassName, EmptyState } from '@/components/ui'

export function SesionPage() {
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
