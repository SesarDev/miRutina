import type { BodyMetric } from '@/db/types'
import { movingAverage, parseBodyValue, seriesOf } from './body'

describe('parseBodyValue', () => {
  it('acepta coma decimal y redondea a un decimal', () => {
    expect(parseBodyValue('bodyweight', '78,46')).toEqual({ value: 78.5, error: null })
    expect(parseBodyValue('waist', ' 86 ')).toEqual({ value: 86, error: null })
  })

  it('vacío = sin medir', () => {
    expect(parseBodyValue('arm', '')).toEqual({ value: null, error: null })
  })

  it('rechaza texto y valores fuera de rango', () => {
    expect(parseBodyValue('bodyweight', 'abc').error).toMatch(/número/)
    expect(parseBodyValue('bodyweight', '7').error).toBe('Entre 20 y 300 kg')
    expect(parseBodyValue('arm', '120').error).toBe('Entre 10 y 100 cm')
  })
})

describe('movingAverage', () => {
  it('media de los últimos 7 días, el propio incluido', () => {
    const out = movingAverage([
      { date: '2026-10-08', value: 79 },
      { date: '2026-10-01', value: 80 },
      { date: '2026-10-07', value: 81 },
      { date: '2026-10-10', value: 78 },
    ])
    expect(out.map((p) => [p.date, p.average])).toEqual([
      ['2026-10-01', 80],
      ['2026-10-07', 80.5], // 1 y 7 oct
      ['2026-10-08', 80], // 7 y 8 oct (el 1 queda fuera)
      ['2026-10-10', 79.3], // 7, 8 y 10 oct
    ])
  })

  it('sin puntos', () => {
    expect(movingAverage([])).toEqual([])
  })
})

describe('seriesOf', () => {
  const row = (date: string, bodyweight: number | null, deletedAt: string | null = null) =>
    ({
      id: date,
      date,
      bodyweight,
      waist: 80,
      chest: null,
      arm: null,
      thigh: null,
      notes: null,
      updatedAt: '',
      deletedAt,
    }) as BodyMetric

  it('ordena, quita los que no tienen el campo y los borrados', () => {
    const rows = [
      row('2026-10-05', 79),
      row('2026-10-01', 80),
      row('2026-10-03', null),
      row('2026-10-04', 70, 'x'),
    ]
    expect(seriesOf(rows, 'bodyweight')).toEqual([
      { date: '2026-10-01', value: 80 },
      { date: '2026-10-05', value: 79 },
    ])
    expect(seriesOf(rows, 'chest')).toEqual([])
  })
})
