/** Body weight and measurements: one record per date. All writes go through repo.save / softDelete. */
import { useLiveQuery } from 'dexie-react-hooks'
import type { DateKey } from '@/lib/dates'
import { uuid } from '@/lib/uuid'
import { patch, save, softDelete } from './repo'
import { db } from './schema'
import type { BodyMetric } from './types'

export type BodyMetricInput = Omit<BodyMetric, 'id' | 'updatedAt' | 'deletedAt'> & { id?: string }

/** The record of a date (not deleted), if any. */
export async function bodyMetricOn(date: DateKey): Promise<BodyMetric | undefined> {
  return (await db.bodyMetrics.where('date').equals(date).toArray()).find((m) => !m.deletedAt)
}

/**
 * Saves a record. Without `id`, a date that already has one updates it, so there is never more
 * than one record per date; with `id`, that record changes (its date too).
 */
export async function saveBodyMetric(input: BodyMetricInput): Promise<BodyMetric> {
  const id = input.id ?? (await bodyMetricOn(input.date))?.id ?? uuid()
  return save('bodyMetrics', { ...input, id })
}

export function deleteBodyMetric(id: string) {
  return softDelete('bodyMetrics', id)
}

/** Undo of a delete: the record comes back as it was. */
export function restoreBodyMetric(id: string) {
  return patch('bodyMetrics', id, { deletedAt: null })
}

/** All records (not deleted), most recent first. undefined while loading. */
export function useBodyMetrics() {
  return useLiveQuery(async () =>
    (await db.bodyMetrics.toArray())
      .filter((m) => !m.deletedAt)
      .sort((a, b) => b.date.localeCompare(a.date)),
  )
}
