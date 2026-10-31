import 'fake-indexeddb/auto'
import {
  applyImport,
  backupFileName,
  createBackup,
  lastExportAt,
  markExported,
  parseBackup,
  planImport,
} from './backup'
import { save, softDelete } from './repo'
import { db } from './schema'
import type { Exercise } from './types'

const catalogue = (id: string, isCustom = false): Exercise => ({
  id,
  name: id,
  nameEs: id,
  bodyPart: 'chest',
  equipment: 'barbell',
  target: 'pectorals',
  secondaryMuscles: [],
  stepsEs: [],
  image: '',
  gif: '',
  isCustom,
  searchTokens: [],
})

const metric = (id: string, date: string, bodyweight: number) =>
  save('bodyMetrics', {
    id,
    date,
    bodyweight,
    waist: null,
    chest: null,
    arm: null,
    thigh: null,
    notes: null,
  })

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('createBackup', () => {
  it('incluye las filas borradas y los ejercicios propios, no el catálogo', async () => {
    await db.exercises.bulkPut([catalogue('0001'), catalogue('mine', true)])
    await metric('m1', '2026-10-30', 80)
    await metric('m2', '2026-10-31', 79)
    await softDelete('bodyMetrics', 'm2')

    const backup = await createBackup(new Date('2026-10-31T12:00:00Z'))
    expect(backup).toMatchObject({
      app: 'mirutina',
      format: 1,
      exportedAt: '2026-10-31T12:00:00.000Z',
    })
    expect(backup.tables.exercises.map((e) => e.id)).toEqual(['mine'])
    expect(backup.tables.bodyMetrics.map((m) => [m.id, m.deletedAt !== null])).toEqual([
      ['m1', false],
      ['m2', true],
    ])
    expect(backupFileName(backup)).toBe('mirutina-2026-10-31.json')
  })
})

describe('parseBackup', () => {
  it('rechaza archivos que no son de miRutina o están mal formados', () => {
    expect(() => parseBackup(null)).toThrow('no es una copia de miRutina')
    expect(() => parseBackup({ app: 'otra' })).toThrow('no es una copia de miRutina')
    expect(() => parseBackup({ app: 'mirutina', format: 99, tables: {} })).toThrow('más nueva')
    expect(() => parseBackup({ app: 'mirutina', format: 1 })).toThrow('faltan las tablas')
    expect(() =>
      parseBackup({ app: 'mirutina', format: 1, tables: { routines: [{ name: 'x' }] } }),
    ).toThrow('sin identificador')
  })

  it('las tablas que faltan cuentan como vacías', () => {
    const b = parseBackup({ app: 'mirutina', format: 1, tables: {} })
    expect(b.tables.sessions).toEqual([])
  })
})

describe('import', () => {
  it('reimportar la propia copia no cambia nada ni duplica', async () => {
    await metric('m1', '2026-10-30', 80)
    const backup = parseBackup(JSON.parse(JSON.stringify(await createBackup())))
    const plan = await planImport(backup)
    expect(plan.find((p) => p.table === 'bodyMetrics')).toMatchObject({
      added: 0,
      updated: 0,
      unchanged: 1,
    })
    await applyImport(backup)
    expect(await db.bodyMetrics.count()).toBe(1)
  })

  it('last-write-wins: entra lo nuevo y lo más reciente, no lo más antiguo', async () => {
    await metric('m1', '2026-10-30', 80)
    await metric('m2', '2026-10-31', 79)
    const backup = parseBackup(JSON.parse(JSON.stringify(await createBackup())))
    const [m1, m2] = backup.tables.bodyMetrics
    backup.tables.bodyMetrics = [
      { ...m1!, bodyweight: 81, updatedAt: '2000-01-01T00:00:00.000Z' }, // older: ignored
      { ...m2!, bodyweight: 78, updatedAt: '2999-01-01T00:00:00.000Z' }, // newer: wins
      { ...m2!, id: 'm3', date: '2026-10-29', bodyweight: 82 }, // new
    ]
    await db.outbox.clear()

    const result = await applyImport(backup)
    expect(result.find((p) => p.table === 'bodyMetrics')).toEqual({
      table: 'bodyMetrics',
      added: 1,
      updated: 1,
      unchanged: 1,
    })
    expect((await db.bodyMetrics.get('m1'))?.bodyweight).toBe(80)
    expect((await db.bodyMetrics.get('m2'))?.bodyweight).toBe(78)
    // The file's edit time is kept, and the rows are queued for sync.
    expect((await db.bodyMetrics.get('m2'))?.updatedAt).toBe('2999-01-01T00:00:00.000Z')
    expect(await db.outbox.count()).toBe(2)
  })
})

describe('lastExportAt', () => {
  it('guarda la fecha de la última exportación', async () => {
    expect(await lastExportAt()).toBeNull()
    await markExported('2026-10-31T12:00:00.000Z')
    expect(await lastExportAt()).toBe('2026-10-31T12:00:00.000Z')
  })
})
