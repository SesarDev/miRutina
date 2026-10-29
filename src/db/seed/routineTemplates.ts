/**
 * Built-in routines (docs/PLANNING.md § Rutinas predefinidas). Local only, never synced.
 * Exercise ids come from the dataset catalogue; routineTemplates.test.ts checks they exist.
 * Bump TEMPLATES_VERSION after editing so devices reload them.
 */
import { applyTechnique, estimateMinutes, linkWithNext, newItem, withOrder } from '@/lib/routines'
import type { RoutineItem, RoutineTemplate, SetTechnique } from '../types'

export const TEMPLATES_VERSION = '2026-10-29.1'

type Spec =
  | string
  | {
      id: string
      technique?: SetTechnique
      sets?: number
      reps?: [number, number]
      restSec?: number
    }

/** Builds items from exercise ids; `[a, b]` pairs become a superset. */
function build(templateId: string, specs: (Spec | [Spec, Spec])[]): RoutineItem[] {
  let items: RoutineItem[] = []
  const pairs: string[] = []
  const add = (spec: Spec) => {
    const s = typeof spec === 'string' ? { id: spec } : spec
    let item = newItem(s.id, items.length, `${templateId}-${items.length}`)
    if (s.technique && s.technique !== 'superserie') item = applyTechnique(item, s.technique)
    if (s.sets) item = { ...item, sets: s.sets }
    if (s.reps) item = { ...item, repMin: s.reps[0], repMax: s.reps[1] }
    if (s.restSec !== undefined) item = { ...item, restSec: s.restSec }
    items.push(item)
    return item.id
  }
  for (const spec of specs) {
    if (Array.isArray(spec)) {
      const first = add(spec[0])
      add(spec[1])
      pairs.push(first)
    } else add(spec)
  }
  for (const first of pairs) items = linkWithNext(items, first)
  // Deterministic group ids, so reloading the seed does not churn them.
  const groupIds = new Map<string, string>()
  items = items.map((it) => {
    if (!it.groupId) return it
    if (!groupIds.has(it.groupId)) groupIds.set(it.groupId, `${templateId}-g${groupIds.size}`)
    return { ...it, groupId: groupIds.get(it.groupId)! }
  })
  return withOrder(items)
}

type Draft = Omit<RoutineTemplate, 'items' | 'durationMin'> & { specs: (Spec | [Spec, Spec])[] }

const DRAFTS: Draft[] = [
  // ── Normales por músculo ──
  {
    id: 'tpl-pecho-triceps',
    name: 'Pecho y tríceps',
    description: 'Empuje clásico: dos press, una apertura y tres ejercicios de tríceps.',
    bodyParts: ['chest', 'upper arms'],
    technique: 'normal',
    specs: [
      { id: '0025', sets: 4, reps: [6, 10], restSec: 150 },
      '0314',
      '0308',
      '0251',
      '0200',
      '0060',
    ],
  },
  {
    id: 'tpl-espalda-biceps',
    name: 'Espalda y bíceps',
    description: 'Tirón vertical y horizontal, y bíceps con barra y martillo.',
    bodyParts: ['back', 'upper arms'],
    technique: 'normal',
    specs: [{ id: '0652', reps: [6, 10], restSec: 150 }, '2330', '0027', '0861', '0031', '0313'],
  },
  {
    id: 'tpl-pierna',
    name: 'Pierna completa',
    description:
      'Sentadilla, prensa y bisagra de cadera, con aislamiento de cuádriceps, femoral y gemelo.',
    bodyParts: ['upper legs', 'lower legs'],
    technique: 'normal',
    specs: [
      { id: '0043', sets: 4, reps: [6, 10], restSec: 180 },
      { id: '0739', reps: [10, 12] },
      { id: '0085', reps: [8, 10], restSec: 150 },
      '0585',
      '0586',
      '0336',
      { id: '1372', sets: 4, reps: [10, 15], restSec: 60 },
    ],
  },
  {
    id: 'tpl-hombro',
    name: 'Hombro y trapecio',
    description: 'Rutina corta: press, elevaciones en tres planos y encogimientos.',
    bodyParts: ['shoulders', 'back'],
    technique: 'normal',
    specs: [
      '0405',
      { id: '0334', reps: [12, 15], restSec: 60 },
      { id: '0380', reps: [12, 15], restSec: 60 },
      '0406',
    ],
  },
  {
    id: 'tpl-torso',
    name: 'Torso',
    description: 'Pecho, espalda y hombro en una sesión. Para un plan torso/pierna.',
    bodyParts: ['chest', 'back', 'shoulders'],
    technique: 'normal',
    specs: [
      { id: '0025', sets: 4, reps: [6, 10], restSec: 150 },
      { id: '0027', sets: 4, reps: [6, 10], restSec: 150 },
      '0047',
      '2330',
      '0405',
      '0334',
      '0861',
    ],
  },
  {
    id: 'tpl-gluteo',
    name: 'Glúteo e isquios',
    description: 'Cadena posterior: puente, peso muerto rumano, zancada y abducción.',
    bodyParts: ['upper legs'],
    technique: 'normal',
    specs: [
      { id: '1409', sets: 4, reps: [8, 12], restSec: 120 },
      '0085',
      '0410',
      '0599',
      { id: '0597', reps: [12, 15], restSec: 60 },
    ],
  },
  // ── Alemanas ──
  {
    id: 'tpl-torso-aleman',
    name: 'Torso alemanas',
    description: '10 × 10 en press de banca y remo con el mismo peso; después, dos accesorios.',
    bodyParts: ['chest', 'back'],
    technique: 'aleman',
    specs: [
      { id: '0025', technique: 'aleman' },
      { id: '0027', technique: 'aleman' },
      '0334',
      '0313',
    ],
  },
  {
    id: 'tpl-pierna-aleman',
    name: 'Pierna alemanas',
    description: '10 × 10 de sentadilla y curl femoral; cierra con gemelo.',
    bodyParts: ['upper legs', 'lower legs'],
    technique: 'aleman',
    specs: [
      { id: '0043', technique: 'aleman' },
      { id: '0586', technique: 'aleman' },
      { id: '1372', reps: [12, 15], restSec: 60 },
    ],
  },
  // ── Descendentes ──
  {
    id: 'tpl-hombro-descendentes',
    name: 'Hombro con descendentes',
    description: 'Press y elevaciones con dos bajadas de peso en cada serie.',
    bodyParts: ['shoulders'],
    technique: 'descendente',
    specs: [
      '0603',
      { id: '0334', technique: 'descendente', reps: [10, 12] },
      { id: '0178', technique: 'descendente', reps: [10, 12] },
      { id: '0380', reps: [12, 15], restSec: 60 },
    ],
  },
  // ── Ascendentes ──
  {
    id: 'tpl-pecho-piramide',
    name: 'Pecho en pirámide',
    description: 'Press en pirámide ascendente (12-10-8-6) y aperturas para terminar.',
    bodyParts: ['chest', 'upper arms'],
    technique: 'ascendente',
    specs: [
      { id: '0025', technique: 'ascendente' },
      { id: '0314', technique: 'ascendente' },
      '0227',
      '0200',
    ],
  },
  // ── Superseries ──
  {
    id: 'tpl-brazos-superseries',
    name: 'Brazos en superseries',
    description: 'Bíceps y tríceps alternados sin descanso entre ellos.',
    bodyParts: ['upper arms'],
    technique: 'superserie',
    specs: [
      ['0031', '0060'],
      ['0313', '0200'],
      ['0070', '0860'],
    ],
  },
  {
    id: 'tpl-fullbody-superseries',
    name: 'Cuerpo completo en superseries',
    description: 'Empuje y tirón, pierna y core, en bloques de dos para ir rápido.',
    bodyParts: ['upper legs', 'chest', 'back'],
    technique: 'superserie',
    specs: [
      ['1760', '0293'],
      ['0289', '2330'],
      ['0085', '0405'],
      ['0336', '0274'],
    ],
  },
]

export const ROUTINE_TEMPLATES: RoutineTemplate[] = DRAFTS.map(({ specs, ...t }) => {
  const items = build(t.id, specs)
  return { ...t, items, durationMin: estimateMinutes(items) }
})
