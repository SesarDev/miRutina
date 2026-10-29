import 'fake-indexeddb/auto'
import { newItem } from '@/lib/routines'
import { newId, onLocalWrite, save, setFavorite, softDelete } from './repo'
import { db } from './schema'
import { ensureSeed } from './seed'

const routine = (name = 'Empuje') => ({
  id: newId(),
  name,
  items: [newItem('0025', 0)],
})

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('repo.save', () => {
  it('guarda la fila con updatedAt y deletedAt null', async () => {
    const row = await save('routines', routine())
    const stored = await db.routines.get(row.id)
    expect(stored?.name).toBe('Empuje')
    expect(stored?.deletedAt).toBeNull()
    expect(Date.parse(stored!.updatedAt)).not.toBeNaN()
  })

  it('añade la fila a la outbox en la misma transacción', async () => {
    const row = await save('routines', routine())
    const pending = await db.outbox.toArray()
    expect(pending).toEqual([expect.objectContaining({ table: 'routines', rowId: row.id })])
  })

  it('deja una sola entrada pendiente por fila aunque se edite varias veces', async () => {
    const row = await save('routines', routine())
    await save('routines', { ...row, name: 'Empuje A' })
    await save('routines', { ...row, name: 'Empuje B' })
    expect(await db.outbox.count()).toBe(1)
    expect((await db.routines.get(row.id))?.name).toBe('Empuje B')
  })

  it('respeta el orden de llegada entre filas distintas', async () => {
    const a = await save('routines', routine('A'))
    const b = await save('routines', routine('B'))
    await save('routines', { ...a, name: 'A2' })
    const order = (await db.outbox.orderBy('seq').toArray()).map((e) => e.rowId)
    expect(order).toEqual([b.id, a.id])
  })

  it('calcula los tokens de búsqueda de los ejercicios propios', async () => {
    const ex = await save('exercises', {
      id: newId(),
      name: '',
      nameEs: 'Press en máquina Hammer',
      bodyPart: 'chest',
      equipment: 'leverage machine',
      target: 'pectorals',
      secondaryMuscles: [],
      stepsEs: [],
      image: '',
      gif: '',
      isCustom: true,
    })
    expect(ex.searchTokens).toEqual(['press', 'en', 'maquina', 'hammer'])
  })

  it('avisa a los suscriptores tras escribir', async () => {
    const listener = vi.fn()
    const off = onLocalWrite(listener)
    await save('routines', routine())
    off()
    await save('routines', routine())
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('routines')
  })
})

describe('repo.softDelete', () => {
  it('marca deletedAt sin borrar la fila y la encola', async () => {
    const row = await save('routines', routine())
    await db.outbox.clear()
    await softDelete('routines', row.id)
    const stored = await db.routines.get(row.id)
    expect(stored).toBeDefined()
    expect(stored?.deletedAt).not.toBeNull()
    expect(stored?.updatedAt).toBe(stored?.deletedAt)
    expect(await db.outbox.count()).toBe(1)
  })

  it('no encola nada si la fila no existe', async () => {
    await softDelete('routines', 'no-existe')
    expect(await db.outbox.count()).toBe(0)
  })
})

describe('setFavorite', () => {
  it('crea los ajustes del ejercicio y conserva los existentes', async () => {
    await save('exerciseSettings', {
      exerciseId: '0025',
      logType: 'weight_reps',
      repMin: 6,
      repMax: 10,
      favorite: false,
      note: 'Banco 3',
    })
    await setFavorite('0025', true)
    const settings = await db.exerciseSettings.get('0025')
    expect(settings).toMatchObject({ favorite: true, repMin: 6, note: 'Banco 3' })

    await setFavorite('0099', true)
    expect(await db.exerciseSettings.get('0099')).toMatchObject({
      favorite: true,
      logType: 'weight_reps',
    })
  })
})

describe('ensureSeed', () => {
  const seed =
    (version: string, nameEs = 'Press de banca con barra') =>
    async () => ({
      version,
      exercises: [
        {
          id: '0025',
          name: 'barbell bench press',
          nameEs,
          bodyPart: 'chest',
          equipment: 'barbell',
          target: 'pectorals',
          secondaryMuscles: ['triceps'],
          stepsEs: ['Túmbate en el banco.'],
          image: '/exercises/images/0025.jpg',
          gif: '/exercises/gifs/0025.gif',
          isCustom: false,
        },
      ],
    })

  it('carga el catálogo con tokens sin tildes en español e inglés', async () => {
    expect(await ensureSeed(seed('v1'))).toBe(true)
    const hits = await db.exercises.where('searchTokens').startsWith('banc').toArray()
    expect(hits.map((e) => e.id)).toEqual(['0025'])
    expect(await db.exercises.where('searchTokens').equals('bench').count()).toBe(1)
  })

  it('no recarga si la versión no cambia y sí si cambia', async () => {
    await ensureSeed(seed('v1'))
    expect(await ensureSeed(seed('v1'))).toBe(false)
    expect(await ensureSeed(seed('v2', 'Press de banca plano con barra'))).toBe(true)
    expect((await db.exercises.get('0025'))?.nameEs).toBe('Press de banca plano con barra')
  })

  it('no toca la outbox: el catálogo no se sincroniza', async () => {
    await ensureSeed(seed('v1'))
    expect(await db.outbox.count()).toBe(0)
  })
})
