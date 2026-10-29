import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/ui'

export function ProgresoPage() {
  return (
    <>
      <PageHeader title="Progreso" />
      <EmptyState
        icon="progress"
        title="Aún no hay nada que comparar"
        description="Cuando registres tus primeras sesiones verás aquí tus récords, el 1RM estimado y cómo evoluciona cada ejercicio, con tus valoraciones."
      />
    </>
  )
}
