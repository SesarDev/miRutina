/** Local data model (CLAUDE.md · Modelo de datos). Supabase mirrors it in snake_case. */

/** Every user table: client-side timestamps for last-write-wins and soft delete. */
export type SyncFields = {
  /** ISO timestamp of the last local change. */
  updatedAt: string
  /** ISO timestamp of the soft delete, or null. Rows are never removed. */
  deletedAt: string | null
}

/** Set feel rating. Shown with its label, never as colour alone. */
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

export type LogType = 'weight_reps' | 'reps' | 'time'

/** Catalogue exercise. Dataset ones are local only; custom ones (`isCustom`) sync as `custom_exercises`. */
export type Exercise = {
  id: string
  /** Dataset name in English (empty for custom exercises). */
  name: string
  nameEs: string
  bodyPart: string
  equipment: string
  target: string
  secondaryMuscles: string[]
  stepsEs: string[]
  /** Public URL, e.g. /exercises/images/0001-xxx.jpg ('' for custom). */
  image: string
  gif: string
  isCustom: boolean
  /** Normalised words of name + nameEs, for the multi-entry search index. */
  searchTokens: string[]
} & Partial<SyncFields>

export type ExerciseSettings = {
  exerciseId: string
  logType: LogType
  repMin: number | null
  repMax: number | null
  favorite: boolean
  note: string | null
} & SyncFields

/** How the sets of an exercise are performed (docs/PLANNING.md § Técnicas de series). */
export type SetTechnique = 'normal' | 'aleman' | 'descendente' | 'ascendente' | 'superserie'

export const TECHNIQUE_LABELS: Record<SetTechnique, string> = {
  normal: 'Normales',
  aleman: 'Alemanas',
  descendente: 'Descendentes',
  ascendente: 'Ascendentes',
  superserie: 'Superserie',
}

export type RoutineItem = {
  /** Stable id of the entry (drag and drop, superset grouping). */
  id: string
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  /** Rest after each set; for a superset, the rest after each round (last item of the group). */
  restSec: number
  order: number
  technique: SetTechnique
  /** Items sharing a groupId form one superset, performed back to back. */
  groupId: string | null
  /** Descendentes: weight drops chained after each set. */
  drops?: number
  /** Ascendentes: target reps of each set, e.g. [12, 10, 8, 6]. */
  repsPerSet?: number[]
}

export type Routine = {
  id: string
  name: string
  items: RoutineItem[]
} & SyncFields

/** Built-in routine (local only, like the catalogue). «Copiar a mis rutinas» creates a Routine. */
export type RoutineTemplate = {
  id: string
  name: string
  description: string
  /** Main body parts (dataset keys), for filters and labels. */
  bodyParts: string[]
  technique: SetTechnique
  /** Estimated minutes: 30, 45, 60 or 75. */
  durationMin: number
  items: RoutineItem[]
}

export type PlannedStatus = 'planned' | 'done' | 'skipped'

export type PlannedWorkout = {
  id: string
  /** YYYY-MM-DD */
  date: string
  routineId: string
  status: PlannedStatus
  sessionId: string | null
} & SyncFields

export type Session = {
  id: string
  /** YYYY-MM-DD */
  date: string
  routineId: string | null
  startedAt: string
  endedAt: string | null
  notes: string | null
} & SyncFields

export type SetLog = {
  id: string
  sessionId: string
  exerciseId: string
  order: number
  /** kg, one decimal at most. */
  weight: number | null
  reps: number | null
  durationSec: number | null
  feel: Feel | null
  isWarmup: boolean
  completedAt: string | null
  note: string | null
} & SyncFields

export type BodyMetric = {
  id: string
  /** YYYY-MM-DD */
  date: string
  bodyweight: number | null
  waist: number | null
  chest: number | null
  arm: number | null
  thigh: number | null
  notes: string | null
} & SyncFields

/** Rows of every table that syncs, keyed by the local table name. */
export type SyncedRows = {
  exercises: Exercise
  exerciseSettings: ExerciseSettings
  routines: Routine
  plannedWorkouts: PlannedWorkout
  sessions: Session
  setLogs: SetLog
  bodyMetrics: BodyMetric
}

export type SyncTable = keyof SyncedRows

export const SYNC_TABLES = [
  'exercises',
  'exerciseSettings',
  'routines',
  'plannedWorkouts',
  'sessions',
  'setLogs',
  'bodyMetrics',
] as const satisfies readonly SyncTable[]

/** A pending local change. Push reads the row's current state, so one entry per row is enough. */
export type OutboxEntry = {
  seq?: number
  table: SyncTable
  rowId: string
  queuedAt: string
}

export type MetaEntry = {
  key: string
  value: unknown
}
