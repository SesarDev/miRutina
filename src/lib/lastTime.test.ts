import type { Feel } from '@/db/types'
import { formatLastTime, relativeDay, summarizeSets, summaryFeel, type PastSet } from './lastTime'

const set = (
  order: number,
  weight: number | null,
  reps: number | null,
  feel: Feel | null = null,
  dropIndex = 0,
): PastSet => ({
  order,
  dropIndex,
  weight,
  reps,
  durationSec: null,
  feel,
  completedAt: '2026-10-25T10:00:00.000Z',
})

describe('relativeDay', () => {
  it.each([
    ['2026-10-29', 'hoy'],
    ['2026-10-28', 'ayer'],
    ['2026-10-25', 'hace 4 días'],
    ['2026-10-08', 'hace 3 semanas'],
    ['2026-03-03', 'el 3 de marzo'],
  ])('%s → %s', (date, text) => {
    expect(relativeDay(date, '2026-10-29')).toBe(text)
  })
})

describe('summarizeSets', () => {
  it('agrupa las series con el mismo peso', () => {
    expect(summarizeSets([set(0, 60, 10), set(1, 60, 10), set(2, 60, 9)])).toBe('60 kg × 10, 10, 9')
  })

  it('un cambio de peso abre otro grupo, con coma decimal', () => {
    expect(summarizeSets([set(0, 60, 10), set(1, 62.5, 8), set(2, 62.5, 7)])).toBe(
      '60 kg × 10 · 62,5 kg × 8, 7',
    )
  })

  it('ordena por serie aunque lleguen desordenadas', () => {
    expect(summarizeSets([set(2, 60, 9), set(0, 60, 10), set(1, 60, 10)])).toBe('60 kg × 10, 10, 9')
  })

  it('encadena las bajadas con flechas', () => {
    expect(
      summarizeSets([
        set(0, 60, 10),
        set(0, 50, 6, null, 1),
        set(0, 40, 5, null, 2),
        set(1, 60, 9),
      ]),
    ).toBe('60 kg × 10 → 50 kg × 6 → 40 kg × 5 · 60 kg × 9')
  })

  it('sin peso (peso corporal) muestra solo repeticiones', () => {
    expect(summarizeSets([set(0, null, 12), set(1, null, 10)])).toBe('12, 10 reps')
  })
})

describe('summaryFeel', () => {
  it('usa la valoración de la última serie', () => {
    expect(summaryFeel([set(0, 60, 10, 'bien'), set(1, 60, 9, 'justo')])).toBe('justo')
  })

  it('si la última no tiene, la más frecuente', () => {
    expect(
      summaryFeel([
        set(0, 60, 10, 'puedo_mas'),
        set(1, 60, 9, 'bien'),
        set(2, 60, 9, 'bien'),
        set(3, 60, 8),
      ]),
    ).toBe('bien')
  })

  it('en empate gana la más reciente', () => {
    expect(summaryFeel([set(0, 60, 10, 'puedo_mas'), set(1, 60, 9, 'bien'), set(2, 60, 8)])).toBe(
      'bien',
    )
  })

  it('sin valoraciones no hay resumen', () => {
    expect(summaryFeel([set(0, 60, 10)])).toBeNull()
  })
})

describe('formatLastTime', () => {
  it('formato completo', () => {
    const session = {
      sessionId: 's',
      date: '2026-10-25',
      sets: [set(0, 60, 10), set(1, 60, 10), set(2, 60, 9, 'puedo_mas')],
    }
    expect(formatLastTime(session, '2026-10-29')).toBe(
      'Última vez (hace 4 días): 60 kg × 10, 10, 9 · Puedo más',
    )
  })

  it('omite la valoración si no hay', () => {
    const session = { sessionId: 's', date: '2026-10-28', sets: [set(0, 60, 10)] }
    expect(formatLastTime(session, '2026-10-29', 'Anterior')).toBe('Anterior (ayer): 60 kg × 10')
  })
})
