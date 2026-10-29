/** Set feel rating (CLAUDE.md · Modelo de datos). Shown with its label, never as colour alone. */
export type Feel = 'demasiado' | 'justo' | 'bien' | 'puedo_mas' | 'poco'

export const FEEL_LABELS: Record<Feel, string> = {
  demasiado: 'Demasiado',
  justo: 'Voy justo',
  bien: 'Bien',
  puedo_mas: 'Puedo más',
  poco: 'Poco',
}

/** From hardest to easiest. */
export const FEELS = Object.keys(FEEL_LABELS) as Feel[]
