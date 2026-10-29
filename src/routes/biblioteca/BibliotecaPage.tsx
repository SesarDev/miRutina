import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/ui'

export function BibliotecaPage() {
  return (
    <>
      <PageHeader title="Biblioteca" />
      <EmptyState
        icon="library"
        title="El catálogo de ejercicios aún no está cargado"
        description="Aquí podrás buscar entre 1.324 ejercicios en español o en inglés, filtrar por músculo y equipo, y ver cada uno animado con sus pasos."
      />
    </>
  )
}
