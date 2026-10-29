import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { buttonClassName, EmptyState } from '@/components/ui'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Página no encontrada" />
      <EmptyState
        title="Esta dirección no lleva a ninguna parte"
        description="Revisa el enlace o vuelve a la pantalla de hoy."
        actions={
          <Link to="/" className={buttonClassName({ variant: 'primary' })}>
            Ir a Hoy
          </Link>
        }
      />
    </>
  )
}
