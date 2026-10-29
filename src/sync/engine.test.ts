import 'fake-indexeddb/auto'
import { newId, save, softDelete } from '@/db/repo'
import { db } from '@/db/schema'
import type { Routine } from '@/db/types'
import { createSyncEngine } from './engine'
import type { RemoteRow } from './mapping'
import { RemoteError, type RemoteStore } from './remote'
import { useSyncStore } from './store'

/** In-memory Supabase that mimics supabase/schema.sql: LWW trigger + server_updated_at. */
class FakeRemote implements RemoteStore {
  tables = new Map<string, Map<string, RemoteRow>>()
  user: string | null = 'user-1'
  failNext = 0
  upsertCalls = 0
  private clock = Date.parse('2026-11-01T10:00:00Z')

  async userId() {
    return this.user
  }

  private tick() {
    this.clock += 1000
    return new Date(this.clock).toISOString()
  }

  table(name: string) {
    if (!this.tables.has(name)) this.tables.set(name, new Map())
    return this.tables.get(name)!
  }

  async upsert(table: string, rows: RemoteRow[], onConflict: string) {
    this.upsertCalls++
    if (this.failNext > 0) {
      this.failNext--
      throw new RemoteError('fetch failed')
    }
    const t = this.table(table)
    for (const row of rows) {
      const key = onConflict
        .split(',')
        .map((c) => String(row[c]))
        .join('|')
      const old = t.get(key)
      const kept = old && Date.parse(row.updated_at) < Date.parse(old.updated_at) ? old : row
      t.set(key, { ...kept, server_updated_at: this.tick() })
    }
  }

  /** A change made by another device. */
  writeFromOtherDevice(table: string, key: string, row: RemoteRow) {
    this.table(table).set(key, { ...row, user_id: 'user-1', server_updated_at: this.tick() })
  }

  async fetchSince(table: string, since: string | null, limit: number) {
    return [...this.table(table).values()]
      .filter((r) => !since || Date.parse(r.server_updated_at!) > Date.parse(since))
      .sort((a, b) => Date.parse(a.server_updated_at!) - Date.parse(b.server_updated_at!))
      .slice(0, limit)
  }
}

const routine = (name: string): Omit<Routine, 'updatedAt' | 'deletedAt'> => ({
  id: newId(),
  name,
  items: [],
})

const remoteRoutine = (id: string, name: string, updatedAt: string): RemoteRow => ({
  id,
  name,
  items: [],
  updated_at: updatedAt,
  deleted_at: null,
})

let remote: FakeRemote
let engine: ReturnType<typeof createSyncEngine>

beforeEach(async () => {
  await db.delete()
  await db.open()
  remote = new FakeRemote()
  engine = createSyncEngine(remote, { maxRetryDelayMs: 10_000_000, pageSize: 2 })
  useSyncStore.setState({ status: 'disabled', lastSyncedAt: null, error: null, failures: 0 })
})

describe('push', () => {
  it('sube la outbox en snake_case con user_id y la vacía', async () => {
    const r = await save('routines', routine('Empuje'))
    expect(await engine.sync()).toBe('ok')
    const stored = remote.table('routines').get(r.id)
    expect(stored).toMatchObject({ id: r.id, name: 'Empuje', user_id: 'user-1', deleted_at: null })
    expect(stored).toHaveProperty('updated_at', r.updatedAt)
    expect(await db.outbox.count()).toBe(0)
    expect(useSyncStore.getState()).toMatchObject({ status: 'idle', failures: 0 })
  })

  it('sube los favoritos con su clave compuesta', async () => {
    await save('exerciseSettings', {
      exerciseId: '0025',
      logType: 'weight_reps',
      repMin: null,
      repMax: null,
      favorite: true,
      note: null,
      weightStep: null,
    })
    await engine.sync()
    expect(remote.table('exercise_settings').get('user-1|0025')).toMatchObject({
      exercise_id: '0025',
      favorite: true,
      log_type: 'weight_reps',
    })
  })

  it('sube los ejercicios propios a custom_exercises y nunca el catálogo', async () => {
    const custom = await save('exercises', {
      id: newId(),
      name: '',
      nameEs: 'Press Hammer',
      bodyPart: 'chest',
      equipment: 'leverage machine',
      target: 'pectorals',
      secondaryMuscles: [],
      stepsEs: [],
      image: '',
      gif: '',
      isCustom: true,
    })
    await save('exercises', { ...custom, id: '0025', isCustom: false, nameEs: 'Press de banca' })
    await engine.sync()
    const uploaded = [...remote.table('custom_exercises').values()]
    expect(uploaded).toHaveLength(1)
    expect(uploaded[0]).toMatchObject({ id: custom.id, name_es: 'Press Hammer' })
    expect(uploaded[0]).not.toHaveProperty('search_tokens')
    expect(uploaded[0]).not.toHaveProperty('is_custom')
  })
})

describe('pull', () => {
  it('trae lo nuevo de otro dispositivo y avanza lastPulledAt (paginado)', async () => {
    for (const name of ['A', 'B', 'C']) {
      const id = newId()
      remote.writeFromOtherDevice('routines', id, remoteRoutine(id, name, '2026-11-01T09:00:00Z'))
    }
    await engine.sync()
    expect((await db.routines.toArray()).map((r) => r.name).sort()).toEqual(['A', 'B', 'C'])
    // Nothing new: a second pull fetches nothing and changes nothing.
    const spy = vi.spyOn(remote, 'fetchSince')
    await engine.pull()
    expect(await db.routines.count()).toBe(3)
    expect(spy.mock.results.length).toBeGreaterThan(0)
  })

  it('conflicto: gana el updatedAt más reciente (remoto más nuevo)', async () => {
    const r = await save('routines', routine('Local'))
    const later = new Date(Date.parse(r.updatedAt) + 60_000).toISOString()
    remote.writeFromOtherDevice('routines', r.id, remoteRoutine(r.id, 'Remoto', later))

    await engine.pull()
    expect((await db.routines.get(r.id))?.name).toBe('Remoto')
    // The losing local change is no longer pending.
    expect(await db.outbox.count()).toBe(0)
  })

  it('conflicto: gana el updatedAt más reciente (local más nuevo)', async () => {
    const r = await save('routines', routine('Local'))
    const earlier = new Date(Date.parse(r.updatedAt) - 60_000).toISOString()
    remote.writeFromOtherDevice('routines', r.id, remoteRoutine(r.id, 'Remoto viejo', earlier))

    await engine.sync()
    expect((await db.routines.get(r.id))?.name).toBe('Local')
    expect(remote.table('routines').get(r.id)?.name).toBe('Local')
  })

  it('propaga un borrado lógico hecho en otro dispositivo', async () => {
    const r = await save('routines', routine('Pierna'))
    await engine.sync()
    const deletedAt = new Date(Date.parse(r.updatedAt) + 1000).toISOString()
    remote.writeFromOtherDevice('routines', r.id, {
      ...remoteRoutine(r.id, 'Pierna', deletedAt),
      deleted_at: deletedAt,
    })
    await engine.sync()
    const local = await db.routines.get(r.id)
    expect(local).toBeDefined()
    expect(local?.deletedAt).toBe(deletedAt)
  })

  it('sube un borrado lógico local', async () => {
    const r = await save('routines', routine('Tirón'))
    await engine.sync()
    await softDelete('routines', r.id)
    await engine.sync()
    expect(remote.table('routines').get(r.id)?.deleted_at).not.toBeNull()
  })
})

describe('sync', () => {
  it('sin sesión no hace nada y conserva la outbox', async () => {
    remote.user = null
    await save('routines', routine('Empuje'))
    expect(await engine.sync()).toBe('skipped')
    expect(await db.outbox.count()).toBe(1)
    expect(useSyncStore.getState().status).toBe('signedOut')
  })

  it('ante un error de red conserva la outbox y reintenta después', async () => {
    remote.failNext = 1
    await save('routines', routine('Empuje'))
    expect(await engine.sync()).toBe('error')
    expect(useSyncStore.getState()).toMatchObject({ status: 'error', failures: 1 })
    expect(await db.outbox.count()).toBe(1)

    expect(await engine.sync()).toBe('ok')
    expect(await db.outbox.count()).toBe(0)
    expect(useSyncStore.getState()).toMatchObject({ status: 'idle', failures: 0, error: null })
  })

  it('no ejecuta dos sincronizaciones a la vez', async () => {
    await save('routines', routine('Empuje'))
    const [a, b] = await Promise.all([engine.sync(), engine.sync()])
    expect(a).toBe('ok')
    expect(b).toBe('ok')
    // First run uploads; the queued re-run finds an empty outbox.
    expect(remote.upsertCalls).toBe(1)
  })
})
