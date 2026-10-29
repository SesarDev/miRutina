import Dexie, { type EntityTable } from 'dexie'
import type {
  BodyMetric,
  Exercise,
  ExerciseSettings,
  MetaEntry,
  OutboxEntry,
  PlannedWorkout,
  Routine,
  Session,
  SetLog,
} from './types'

export class AppDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  exerciseSettings!: EntityTable<ExerciseSettings, 'exerciseId'>
  routines!: EntityTable<Routine, 'id'>
  plannedWorkouts!: EntityTable<PlannedWorkout, 'id'>
  sessions!: EntityTable<Session, 'id'>
  setLogs!: EntityTable<SetLog, 'id'>
  bodyMetrics!: EntityTable<BodyMetric, 'id'>
  outbox!: EntityTable<OutboxEntry, 'seq'>
  meta!: EntityTable<MetaEntry, 'key'>

  constructor(name = 'mirutina') {
    super(name)
    this.version(1).stores({
      exercises: 'id, bodyPart, equipment, target, *searchTokens, isCustom',
      exerciseSettings: 'exerciseId, favorite, updatedAt',
      routines: 'id, updatedAt',
      plannedWorkouts: 'id, date, routineId, status, updatedAt',
      sessions: 'id, date, routineId, updatedAt',
      setLogs: 'id, sessionId, exerciseId, [exerciseId+completedAt], updatedAt',
      bodyMetrics: 'id, date, updatedAt',
      outbox: '++seq, table, rowId, [table+rowId]',
      meta: 'key',
    })
  }
}

export const db = new AppDB()

/** Primary key field of each table (exerciseSettings is keyed by exercise). */
export const PRIMARY_KEY = {
  exercises: 'id',
  exerciseSettings: 'exerciseId',
  routines: 'id',
  plannedWorkouts: 'id',
  sessions: 'id',
  setLogs: 'id',
  bodyMetrics: 'id',
} as const
