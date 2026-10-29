import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/ui'

export function RutinasPage() {
  return (
    <>
      <PageHeader title="Rutinas" />
      <EmptyState
        icon="routines"
        title="Todavía no tienes rutinas"
        description="Una rutina es tu plantilla de entreno: ejercicios, series, rango de reps y descanso. Créala una vez y asígnala a los días que quieras."
      />
    </>
  )
}
