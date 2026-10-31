import 'fake-indexeddb/auto'
import { bodyMetricOn, deleteBodyMetric, restoreBodyMetric, saveBodyMetric } from './body'
import { db } from './schema'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const values = { bodyweight: 80, waist: null, chest: null, arm: null, thigh: null, notes: null }

describe('saveBodyMetric', () => {
  it('un registro por fecha: guardar otra vez la misma fecha lo actualiza', async () => {
    const first = await saveBodyMetric({ date: '2026-10-31', ...values })
    const second = await saveBodyMetric({ date: '2026-10-31', ...values, bodyweight: 79.5 })
    expect(second.id).toBe(first.id)
    expect(await db.bodyMetrics.count()).toBe(1)
    expect((await bodyMetricOn('2026-10-31'))?.bodyweight).toBe(79.5)
  })

  it('queda en la outbox para sincronizar', async () => {
    const saved = await saveBodyMetric({ date: '2026-10-31', ...values })
    expect(await db.outbox.where('[table+rowId]').equals(['bodyMetrics', saved.id]).count()).toBe(1)
  })

  it('con id cambia ese registro, también su fecha', async () => {
    const saved = await saveBodyMetric({ date: '2026-10-30', ...values })
    await saveBodyMetric({ ...saved, date: '2026-10-29' })
    expect(await bodyMetricOn('2026-10-30')).toBeUndefined()
    expect((await bodyMetricOn('2026-10-29'))?.id).toBe(saved.id)
  })
})

describe('deleteBodyMetric', () => {
  it('borrado suave y deshacer', async () => {
    const saved = await saveBodyMetric({ date: '2026-10-31', ...values })
    await deleteBodyMetric(saved.id)
    expect(await bodyMetricOn('2026-10-31')).toBeUndefined()
    expect((await db.bodyMetrics.get(saved.id))?.deletedAt).not.toBeNull()

    await restoreBodyMetric(saved.id)
    expect((await bodyMetricOn('2026-10-31'))?.bodyweight).toBe(80)
  })

  it('tras borrar, la misma fecha crea un registro nuevo', async () => {
    const saved = await saveBodyMetric({ date: '2026-10-31', ...values })
    await deleteBodyMetric(saved.id)
    const again = await saveBodyMetric({ date: '2026-10-31', ...values })
    expect(again.id).not.toBe(saved.id)
  })
})
