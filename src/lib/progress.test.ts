import {
  detectRecords,
  consistencyWeeks,
  estimated1RM,
  formatRecord,
  groupRecords,
  setsByBodyPart,
  formatSet,
  metricOf,
  rangeStart,
  personalRecords,
  recordsBySession,
  sessionStats,
  workSets,
  type ExerciseSession,
  type ProgressSet,
} from './progress'

const DONE = '2026-10-25T10:00:00.000Z'

const set = (
  weight: number | null,
  reps: number | null,
  opts: Partial<ProgressSet> = {},
): ProgressSet => ({ weight, reps, isWarmup: false, completedAt: DONE, dropIndex: 0, ...opts })

const warmup = (weight: number, reps: number) => set(weight, reps, { isWarmup: true })

let n = 0
const session = (
  date: string,
  sets: ProgressSet[],
  startedAt = `${date}T10:00:00.000Z`,
): ExerciseSession => ({
  sessionId: `s${++n}-${date}`,
  date,
  startedAt,
  sets,
})

const kinds = (records: { kind: string }[]) => records.map((r) => r.kind).sort()

describe('estimated1RM', () => {
  it('aplica Epley con un decimal', () => {
    expect(estimated1RM(100, 10)).toBe(133.3)
    expect(estimated1RM(60, 5)).toBe(70)
    expect(estimated1RM(80, 1)).toBe(82.7)
  })

  it('12 reps aún cuenta; 13 o más no', () => {
    expect(estimated1RM(50, 12)).toBe(70)
    expect(estimated1RM(50, 13)).toBeNull()
    expect(estimated1RM(50, 20)).toBeNull()
  })

  it('null en calentamientos, sin peso o sin reps', () => {
    expect(estimated1RM(60, 10, true)).toBeNull()
    expect(estimated1RM(null, 10)).toBeNull()
    expect(estimated1RM(0, 10)).toBeNull()
    expect(estimated1RM(60, null)).toBeNull()
    expect(estimated1RM(60, 0)).toBeNull()
  })
})

describe('workSets', () => {
  it('quita calentamientos, filas sin marcar y series sin reps', () => {
    const sets = [
      warmup(40, 10),
      set(60, 10),
      set(60, 8, { completedAt: null }),
      set(60, 0),
      set(60, null),
    ]
    expect(workSets(sets)).toEqual([set(60, 10)])
  })
})

describe('sessionStats', () => {
  it('mejor serie, volumen y 1RM', () => {
    const stats = sessionStats([warmup(40, 10), set(60, 10), set(62.5, 8), set(62.5, 6)])
    expect(stats.bestSet).toEqual({ weight: 62.5, reps: 8 })
    expect(stats.volume).toBe(600 + 500 + 375)
    expect(stats.best1RM).toBe(80) // 60 × (1 + 10/30) = 80; 62,5 × 8 → 79,2
    expect(stats.maxWeight).toBe(62.5)
    expect(stats.maxReps).toBe(10)
  })

  it('los calentamientos no cuentan para nada', () => {
    const stats = sessionStats([warmup(100, 5), set(60, 10)])
    expect(stats.maxWeight).toBe(60)
    expect(stats.volume).toBe(600)
  })

  it('las series de más de 12 reps suman volumen pero no 1RM', () => {
    const stats = sessionStats([set(30, 15), set(30, 14)])
    expect(stats.best1RM).toBeNull()
    expect(stats.volume).toBe(870)
    expect(stats.bestSet).toEqual({ weight: 30, reps: 15 })
  })

  it('las bajadas suman volumen pero no definen la mejor serie', () => {
    const stats = sessionStats([set(60, 8), set(40, 15, { dropIndex: 1 })])
    expect(stats.volume).toBe(480 + 600)
    expect(stats.maxReps).toBe(8)
  })

  it('peso corporal: mejor serie por reps, sin peso ni 1RM', () => {
    const stats = sessionStats([set(null, 10), set(null, 12)])
    expect(stats.bestSet).toEqual({ weight: null, reps: 12 })
    expect(stats.maxWeight).toBeNull()
    expect(stats.best1RM).toBeNull()
    expect(stats.volume).toBe(0)
  })

  it('sin series de trabajo', () => {
    expect(sessionStats([warmup(40, 10)])).toEqual({
      bestSet: null,
      volume: 0,
      best1RM: null,
      maxWeight: null,
      maxReps: null,
    })
  })
})

describe('detectRecords', () => {
  const a = session('2026-10-01', [set(60, 10), set(60, 10), set(60, 9)])

  it('la primera sesión no tiene récords', () => {
    expect(detectRecords('ex', a, [])).toEqual([])
    expect(detectRecords('ex', a, [a])).toEqual([])
  })

  it('más peso, mejor 1RM y más volumen', () => {
    const b = session('2026-10-05', [set(65, 10), set(65, 10), set(65, 9)])
    const records = detectRecords('ex', b, [a])
    expect(kinds(records)).toEqual(['e1rm', 'volume', 'weight'])
    expect(records.find((r) => r.kind === 'weight')).toMatchObject({ value: 65, previous: 60 })
    expect(records.find((r) => r.kind === 'volume')).toMatchObject({ value: 1885, previous: 1740 })
    expect(records.find((r) => r.kind === 'e1rm')).toMatchObject({ value: 86.7, previous: 80 })
  })

  it('más reps al mismo peso', () => {
    const b = session('2026-10-05', [set(60, 11), set(60, 8)])
    const records = detectRecords('ex', b, [a])
    expect(records.find((r) => r.kind === 'reps')).toMatchObject({
      value: 11,
      previous: 10,
      weight: 60,
    })
  })

  it('un peso nuevo no es récord de reps (no hay con qué comparar)', () => {
    const b = session('2026-10-05', [set(55, 15)])
    expect(kinds(detectRecords('ex', b, [a]))).toEqual([])
  })

  it('igualar no es récord', () => {
    const b = session('2026-10-05', [set(60, 10), set(60, 10), set(60, 9)])
    expect(detectRecords('ex', b, [a])).toEqual([])
  })

  it('solo compara con sesiones anteriores', () => {
    const later = session('2026-10-20', [set(100, 10)])
    const b = session('2026-10-05', [set(65, 10)])
    expect(kinds(detectRecords('ex', b, [a, later]))).toContain('weight')
  })

  it('en el mismo día, ordena por hora de inicio', () => {
    const morning = session('2026-10-05', [set(60, 10)], '2026-10-05T08:00:00.000Z')
    const evening = session('2026-10-05', [set(62.5, 10)], '2026-10-05T19:00:00.000Z')
    expect(kinds(detectRecords('ex', evening, [morning]))).toContain('weight')
    expect(detectRecords('ex', morning, [evening])).toEqual([])
  })

  it('ignora los calentamientos de ambos lados', () => {
    const withWarmup = session('2026-10-01', [warmup(100, 5), set(60, 10)])
    const b = session('2026-10-05', [warmup(110, 5), set(62.5, 10)])
    const weight = detectRecords('ex', b, [withWarmup]).find((r) => r.kind === 'weight')
    expect(weight).toMatchObject({ value: 62.5, previous: 60 })
  })

  it('una sesión anterior solo de calentamiento no cuenta como precedente', () => {
    const onlyWarmup = session('2026-10-01', [warmup(40, 10)])
    expect(detectRecords('ex', session('2026-10-05', [set(60, 10)]), [onlyWarmup])).toEqual([])
  })

  it('con más de 12 reps no hay récord de 1RM, pero sí de reps y volumen', () => {
    const prev = session('2026-10-01', [set(30, 13)])
    const b = session('2026-10-05', [set(30, 15)])
    expect(kinds(detectRecords('ex', b, [prev]))).toEqual(['reps', 'volume'])
  })

  it('una serie de 13 reps no bate un 1RM aunque su Epley fuera mayor', () => {
    const prev = session('2026-10-01', [set(50, 10)]) // 66,7
    const b = session('2026-10-05', [set(50, 20)]) // Epley 83,3, pero no cuenta
    expect(kinds(detectRecords('ex', b, [prev]))).not.toContain('e1rm')
  })

  it('peso corporal: récord de reps sin peso', () => {
    const prev = session('2026-10-01', [set(null, 10)])
    const b = session('2026-10-05', [set(null, 12)])
    const records = detectRecords('ex', b, [prev])
    expect(kinds(records)).toEqual(['reps'])
    expect(records[0]).toMatchObject({ value: 12, previous: 10, weight: null })
  })

  it('las bajadas no dan récords de reps ni de peso', () => {
    const prev = session('2026-10-01', [set(60, 8), set(40, 10)])
    const b = session('2026-10-05', [set(60, 8), set(40, 14, { dropIndex: 1 })])
    expect(kinds(detectRecords('ex', b, [prev]))).not.toContain('reps')
  })

  it('apunta a la serie que lo consiguió', () => {
    const b = session('2026-10-05', [set(60, 10, { id: 'x' }), set(70, 5, { id: 'y' })])
    expect(detectRecords('ex', b, [a]).find((r) => r.kind === 'weight')?.setId).toBe('y')
  })
})

describe('recordsBySession', () => {
  it('cada sesión contra las anteriores', () => {
    const s1 = session('2026-10-01', [set(60, 10)])
    const s2 = session('2026-10-05', [set(62.5, 10)])
    const s3 = session('2026-10-09', [set(62.5, 10)])
    const map = recordsBySession('ex', [s3, s1, s2])
    expect(map.has(s1.sessionId)).toBe(false)
    expect(kinds(map.get(s2.sessionId)!)).toEqual(['e1rm', 'volume', 'weight'])
    expect(map.has(s3.sessionId)).toBe(false)
  })
})

describe('personalRecords', () => {
  it('mejores marcas con la fecha en que se consiguieron', () => {
    const records = personalRecords([
      session('2026-10-09', [set(62.5, 8)]),
      session('2026-10-01', [warmup(100, 3), set(60, 12)]),
      session('2026-10-05', [set(62.5, 8), set(62.5, 8)]),
    ])
    expect(records.maxWeight).toEqual({ value: 62.5, reps: 8, date: '2026-10-05' })
    expect(records.best1RM).toEqual({ value: 84, date: '2026-10-01' })
    expect(records.bestVolume).toEqual({ value: 1000, date: '2026-10-05' })
    expect(records.maxReps).toEqual({ value: 12, weight: 60, date: '2026-10-01' })
  })

  it('sin sesiones', () => {
    expect(personalRecords([])).toEqual({
      maxWeight: null,
      best1RM: null,
      bestVolume: null,
      maxReps: null,
    })
  })
})

describe('formatRecord', () => {
  const base = { exerciseId: 'ex', sessionId: 's', date: '2026-10-05' }
  it.each([
    [{ kind: 'weight', value: 62.5, previous: 60 }, 'Más peso: 62,5 kg (antes 60 kg)'],
    [{ kind: 'reps', value: 11, previous: 10, weight: 60 }, 'Más reps con 60 kg: 11 (antes 10)'],
    [
      { kind: 'reps', value: 12, previous: 10, weight: null },
      'Más reps con peso corporal: 12 (antes 10)',
    ],
    [{ kind: 'e1rm', value: 86.7, previous: 80 }, 'Mejor 1RM estimado: 86,7 kg (antes 80 kg)'],
    [{ kind: 'volume', value: 1885, previous: 1740 }, 'Más volumen: 1885 kg (antes 1740 kg)'],
  ] as const)('%o', (record, text) => {
    expect(formatRecord({ ...base, ...record })).toBe(text)
  })
})

describe('rangeStart', () => {
  it('meses hacia atrás desde hoy, incluido el día siguiente', () => {
    expect(rangeStart('1m', '2026-10-31')).toBe('2026-10-01')
    expect(rangeStart('3m', '2026-10-31')).toBe('2026-08-01')
    expect(rangeStart('1y', '2026-10-31')).toBe('2025-11-01')
    expect(rangeStart('all', '2026-10-31')).toBeNull()
  })
})

describe('metricOf', () => {
  const stats = sessionStats([set(60, 10)])
  it('elige la cifra de la gráfica', () => {
    expect(metricOf(stats, 'weight')).toBe(60)
    expect(metricOf(stats, 'e1rm')).toBe(80)
    expect(metricOf(stats, 'volume')).toBe(600)
    expect(metricOf(sessionStats([set(null, 10)]), 'volume')).toBeNull()
  })
})

describe('formatSet', () => {
  it('peso × reps o reps sin peso', () => {
    expect(formatSet({ weight: 62.5, reps: 8 })).toBe('62,5 kg × 8')
    expect(formatSet({ weight: null, reps: 12 })).toBe('12 reps')
  })
})

describe('consistencyWeeks', () => {
  // 2026-10-31 is a Saturday.
  const weeks = consistencyWeeks(
    ['2026-10-26', '2026-10-28', '2026-10-28', '2026-10-19', '2026-08-01'],
    '2026-10-31',
  )

  it('12 semanas de lunes a domingo, la actual al final', () => {
    expect(weeks).toHaveLength(12)
    expect(weeks.at(-1)!.start).toBe('2026-10-26')
    expect(weeks[0]!.start).toBe('2026-08-10')
  })

  it('cuenta días distintos entrenados por semana', () => {
    expect(weeks.at(-1)!.count).toBe(2)
    expect(weeks.at(-2)!.count).toBe(1)
    expect(weeks[0]!.count).toBe(0)
  })

  it('los días futuros de esta semana no cuentan', () => {
    expect(weeks.at(-1)!.days.map((d) => d.trained)).toEqual([
      true,
      false,
      true,
      false,
      false,
      false,
      null,
    ])
  })
})

describe('groupRecords', () => {
  const r = (
    exerciseId: string,
    date: string,
    kind: 'weight' | 'reps',
    value: number,
    weight?: number,
  ) => ({
    exerciseId,
    sessionId: date,
    date,
    kind,
    value,
    previous: value - 1,
    weight,
  })

  it('agrupa por ejercicio y deja solo el último de cada tipo', () => {
    const groups = groupRecords([
      r('press', '2026-10-05', 'weight', 62.5),
      r('press', '2026-10-12', 'weight', 65),
      r('press', '2026-10-12', 'reps', 11, 60),
      r('remo', '2026-10-20', 'weight', 70),
    ])
    expect(groups.map((g) => g.exerciseId)).toEqual(['remo', 'press'])
    expect(groups[1]!.records.map((x) => [x.kind, x.value])).toEqual([
      ['weight', 65],
      ['reps', 11],
    ])
    expect(groups[1]!.date).toBe('2026-10-12')
  })
})

describe('setsByBodyPart', () => {
  const row = (date: string, bodyPart: string, extra = {}) => ({
    date,
    bodyPart,
    isWarmup: false,
    dropIndex: 0,
    completedAt: 'x',
    ...extra,
  })

  it('series de trabajo de esta semana y de la anterior por grupo muscular', () => {
    // 2026-11-04 is a Wednesday: this week starts on 2 Nov, the previous one on 26 Oct.
    const result = setsByBodyPart(
      [
        row('2026-11-02', 'chest'),
        row('2026-11-04', 'chest'),
        row('2026-11-04', 'chest', { isWarmup: true }),
        row('2026-11-04', 'chest', { dropIndex: 1 }),
        row('2026-10-28', 'chest'),
        row('2026-10-30', 'back'),
        row('2026-10-20', 'back'),
      ],
      '2026-11-04',
    )
    expect(result).toEqual([
      { bodyPart: 'chest', sets: 2, previous: 1 },
      { bodyPart: 'back', sets: 0, previous: 1 },
    ])
  })
})
