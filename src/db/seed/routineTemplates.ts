/**
 * Built-in routines (docs/PLANNING.md § Rutinas predefinidas). Local only, never synced.
 * Exercise ids come from the dataset catalogue; routineTemplates.test.ts checks they exist.
 * Bump TEMPLATES_VERSION after editing so devices reload them.
 */
import { applyTechnique, estimateMinutes, linkWithNext, newItem, withOrder } from '@/lib/routines'
import type { RoutineItem, RoutineTemplate, SetTechnique } from '../types'

export const TEMPLATES_VERSION = '2026-11-05.1'

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

type Draft = Omit<RoutineTemplate, 'items' | 'durationMin' | 'position'> & {
  specs: (Spec | [Spec, Spec])[]
}

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
  // ═══ Solo mancuernas, banco y peso corporal, por grupo muscular ═══
  {
    id: 'tpl-mc-pecho',
    name: 'Pecho con mancuernas',
    description: 'Press plano e inclinado, aperturas y flexiones para terminar.',
    bodyParts: ['chest'],
    technique: 'normal',
    minimal: true,
    specs: [
      { id: '0289', sets: 4, reps: [8, 12], restSec: 150 },
      '0314',
      '0308',
      { id: '0662', reps: [10, 20], restSec: 90 },
    ],
  },
  {
    id: 'tpl-mc-pecho-superior',
    name: 'Pecho superior con mancuernas',
    description:
      'Todo en banco inclinado: press, agarre neutro y aperturas, con flexiones declinadas.',
    bodyParts: ['chest'],
    technique: 'normal',
    minimal: true,
    specs: [
      { id: '0314', sets: 4, reps: [8, 12], restSec: 150 },
      '0324',
      '0319',
      { id: '0279', reps: [8, 15], restSec: 90 },
    ],
  },
  {
    id: 'tpl-mc-pecho-superseries',
    name: 'Pecho en superseries',
    description: 'Cada press con su aislamiento detrás, sin descanso entre ellos.',
    bodyParts: ['chest'],
    technique: 'superserie',
    minimal: true,
    specs: [
      ['0289', '0308'],
      ['0314', '0319'],
      [{ id: '0662', reps: [10, 20] }, '0375'],
    ],
  },
  {
    id: 'tpl-mc-pecho-descendentes',
    name: 'Pecho con descendentes',
    description: 'Press y aperturas con dos bajadas de peso: corto e intenso.',
    bodyParts: ['chest'],
    technique: 'descendente',
    minimal: true,
    specs: [
      { id: '0289', technique: 'descendente' },
      '0314',
      { id: '0308', technique: 'descendente', reps: [10, 15] },
    ],
  },
  {
    id: 'tpl-mc-espalda',
    name: 'Espalda con mancuernas',
    description:
      'Remos con las dos manos, a una mano y en banco inclinado, pullover y encogimientos.',
    bodyParts: ['back'],
    technique: 'normal',
    minimal: true,
    specs: [
      { id: '0293', sets: 4, reps: [8, 12], restSec: 150 },
      '0292',
      '0327',
      '0433',
      { id: '0406', reps: [12, 15], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-espalda-superseries',
    name: 'Espalda en superseries',
    description:
      'Remo con pullover, remo en banco con aperturas inversas, encogimientos con elevación en Y.',
    bodyParts: ['back', 'shoulders'],
    technique: 'superserie',
    minimal: true,
    specs: [
      ['0292', '0433'],
      ['0327', { id: '0383', reps: [12, 15] }],
      [
        { id: '0406', reps: [12, 15] },
        { id: '3541', reps: [10, 15] },
      ],
    ],
  },
  {
    id: 'tpl-mc-espalda-piramide',
    name: 'Espalda en pirámide',
    description: 'Remos en pirámide ascendente (12-10-8-6), peso muerto y aperturas inversas.',
    bodyParts: ['back', 'upper legs'],
    technique: 'ascendente',
    minimal: true,
    specs: [
      { id: '0293', technique: 'ascendente' },
      { id: '0292', technique: 'ascendente' },
      '0300',
      { id: '0383', reps: [12, 15], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-hombro',
    name: 'Hombro con mancuernas',
    description: 'Press sentado y elevaciones en las tres direcciones, con encogimientos.',
    bodyParts: ['shoulders'],
    technique: 'normal',
    minimal: true,
    specs: [
      { id: '0405', sets: 4, reps: [8, 12], restSec: 150 },
      { id: '0334', reps: [12, 15], restSec: 90 },
      { id: '0310', reps: [10, 12], restSec: 90 },
      { id: '0378', reps: [12, 15], restSec: 90 },
      { id: '0406', reps: [12, 15], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-hombro-arnold',
    name: 'Hombro Arnold con descendentes',
    description: 'Press Arnold, remo al mentón y elevaciones laterales con dos bajadas.',
    bodyParts: ['shoulders'],
    technique: 'descendente',
    minimal: true,
    specs: [
      { id: '2137', sets: 4, reps: [8, 12], restSec: 150 },
      '0437',
      { id: '0334', technique: 'descendente', reps: [10, 15] },
      { id: '0348', reps: [12, 15], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-hombro-superseries',
    name: 'Hombro en superseries',
    description:
      'Press de pie con laterales, frontales con posteriores y remo al mentón con encogimientos.',
    bodyParts: ['shoulders'],
    technique: 'superserie',
    minimal: true,
    specs: [
      ['0426', { id: '0334', reps: [12, 15] }],
      ['0310', { id: '0378', reps: [12, 15] }],
      ['0437', { id: '0406', reps: [12, 15] }],
    ],
  },
  {
    id: 'tpl-mc-biceps',
    name: 'Bíceps con mancuernas',
    description: 'Curl de pie, martillo, inclinado en banco, concentrado y Zottman.',
    bodyParts: ['upper arms'],
    technique: 'normal',
    minimal: true,
    specs: [
      { id: '0294', sets: 4, reps: [8, 12] },
      { id: '0313', restSec: 90 },
      { id: '0318', restSec: 90 },
      { id: '0297', reps: [10, 15], restSec: 60 },
      { id: '0439', reps: [10, 12], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-triceps',
    name: 'Tríceps con mancuernas',
    description: 'Extensiones tumbado y sentado, patada, press cerrado y fondos en banco.',
    bodyParts: ['upper arms'],
    technique: 'normal',
    minimal: true,
    specs: [
      { id: '0351', sets: 4, reps: [8, 12] },
      { id: '1731', restSec: 90 },
      { id: '2188', restSec: 90 },
      { id: '0333', reps: [10, 15], restSec: 60 },
      { id: '0129', reps: [10, 20], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-brazos-superseries',
    name: 'Brazos con mancuernas en superseries',
    description: 'Cuatro parejas de bíceps y tríceps, una detrás de otra.',
    bodyParts: ['upper arms'],
    technique: 'superserie',
    minimal: true,
    specs: [
      ['0294', '0351'],
      ['0313', '2188'],
      ['0297', '0333'],
      ['0439', { id: '0129', reps: [10, 20] }],
    ],
  },
  {
    id: 'tpl-mc-brazos-descendentes',
    name: 'Brazos con descendentes',
    description: 'Curl alterno y extensión tumbado con dos bajadas; martillo y patada para cerrar.',
    bodyParts: ['upper arms'],
    technique: 'descendente',
    minimal: true,
    specs: [
      { id: '0285', technique: 'descendente' },
      { id: '0351', technique: 'descendente' },
      { id: '0313', restSec: 90 },
      { id: '0333', reps: [10, 15], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-cuadriceps',
    name: 'Cuádriceps con mancuernas',
    description: 'Sentadilla goblet, sentadilla dividida, zancadas, subida al banco y gemelos.',
    bodyParts: ['upper legs', 'lower legs'],
    technique: 'normal',
    minimal: true,
    specs: [
      { id: '1760', sets: 4, reps: [8, 12], restSec: 150 },
      '0410',
      '0336',
      '0431',
      { id: '0417', sets: 4, reps: [12, 20], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-femoral-gluteo',
    name: 'Femoral y glúteo con mancuernas',
    description:
      'Peso muerto rumano, puente de glúteos en banco, peso muerto a una pierna y zancada atrás.',
    bodyParts: ['upper legs'],
    technique: 'normal',
    minimal: true,
    specs: [
      { id: '1459', sets: 4, reps: [8, 12], restSec: 150 },
      { id: '3523', reps: [10, 15] },
      '1757',
      '0381',
      { id: '2808', reps: [12, 15], restSec: 90 },
    ],
  },
  {
    id: 'tpl-mc-pierna',
    name: 'Pierna completa con mancuernas',
    description: 'Un poco de todo: sentadilla, peso muerto rumano, zancadas, puente y gemelos.',
    bodyParts: ['upper legs', 'lower legs'],
    technique: 'normal',
    minimal: true,
    specs: [
      { id: '0413', sets: 4, reps: [8, 12], restSec: 150 },
      '1459',
      '0336',
      { id: '3523', reps: [10, 15] },
      { id: '0409', reps: [12, 20], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-pierna-superseries',
    name: 'Pierna en superseries',
    description:
      'Cuádriceps y femoral alternados: goblet con rumano, zancada con puente, banco con gemelos.',
    bodyParts: ['upper legs', 'lower legs'],
    technique: 'superserie',
    minimal: true,
    specs: [
      ['1760', '1459'],
      ['0336', { id: '3523', reps: [10, 15] }],
      ['0431', { id: '0417', reps: [12, 20] }],
    ],
  },
  {
    id: 'tpl-mc-gluteo',
    name: 'Glúteo con mancuernas',
    description:
      'Puente en banco, zancada atrás, peso muerto a una pierna, tirón de sumo y puente con marcha.',
    bodyParts: ['upper legs'],
    technique: 'normal',
    minimal: true,
    specs: [
      { id: '3523', sets: 4, reps: [10, 15], restSec: 120 },
      '0381',
      '1757',
      { id: '2808', reps: [12, 15] },
      { id: '3561', reps: [12, 20], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-pierna-alemanas',
    name: 'Pierna en series alemanas',
    description: 'Sentadilla goblet y peso muerto rumano a 10 × 10, con gemelos al final.',
    bodyParts: ['upper legs', 'lower legs'],
    technique: 'aleman',
    minimal: true,
    specs: [
      { id: '1760', technique: 'aleman' },
      { id: '1459', technique: 'aleman' },
      { id: '0417', reps: [12, 20], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-abdomen',
    name: 'Abdomen',
    description:
      'Crunch, crunch inverso, giro ruso, elevación de piernas en banco, flexión lateral y dead bug.',
    bodyParts: ['waist'],
    technique: 'normal',
    minimal: true,
    specs: [
      { id: '0274', reps: [15, 20], restSec: 60 },
      { id: '0872', reps: [12, 20], restSec: 60 },
      { id: '0687', reps: [16, 24], restSec: 60 },
      { id: '0620', reps: [10, 15], restSec: 60 },
      { id: '0407', reps: [12, 15], restSec: 60 },
      { id: '0276', reps: [10, 16], restSec: 60 },
    ],
  },
  {
    id: 'tpl-mc-abdomen-superseries',
    name: 'Abdomen en superseries',
    description: 'Tres parejas de abdomen sin descanso entre ejercicios.',
    bodyParts: ['waist'],
    technique: 'superserie',
    minimal: true,
    specs: [
      [
        { id: '0274', reps: [15, 20] },
        { id: '0872', reps: [12, 20], restSec: 60 },
      ],
      [
        { id: '0687', reps: [16, 24] },
        { id: '0620', reps: [10, 15], restSec: 60 },
      ],
      [
        { id: '0276', reps: [10, 16] },
        { id: '0407', reps: [12, 15], restSec: 60 },
      ],
    ],
  },
  {
    id: 'tpl-mc-empuje',
    name: 'Empuje con mancuernas',
    description:
      'Pecho, hombro y tríceps: dos press de pecho, press de hombro, laterales y dos de tríceps.',
    bodyParts: ['chest', 'shoulders', 'upper arms'],
    technique: 'normal',
    minimal: true,
    specs: ['0289', '0314', '0405', { id: '0334', reps: [12, 15], restSec: 90 }, '0351', '0333'],
  },
  {
    id: 'tpl-mc-tiron',
    name: 'Tirón con mancuernas',
    description:
      'Espalda, deltoides posterior y bíceps: remos, aperturas inversas, encogimientos y curls.',
    bodyParts: ['back', 'upper arms'],
    technique: 'normal',
    minimal: true,
    specs: [
      '0293',
      '0292',
      { id: '0383', reps: [12, 15], restSec: 90 },
      { id: '0406', reps: [12, 15], restSec: 60 },
      '0294',
      '0313',
    ],
  },
  {
    id: 'tpl-mc-torso',
    name: 'Torso con mancuernas',
    description:
      'Un ejercicio por músculo del tren superior: pecho, espalda, hombro, bíceps y tríceps.',
    bodyParts: ['chest', 'back', 'shoulders', 'upper arms'],
    technique: 'normal',
    minimal: true,
    specs: ['0289', '0293', '0405', '0292', '0294', '0351'],
  },
  {
    id: 'tpl-mc-fullbody',
    name: 'Cuerpo completo con mancuernas',
    description: 'Sentadilla, press, remo, peso muerto rumano, press de hombro y abdomen.',
    bodyParts: ['upper legs', 'chest', 'back', 'shoulders'],
    technique: 'normal',
    minimal: true,
    specs: ['1760', '0289', '0293', '1459', '0405', { id: '0274', reps: [15, 20], restSec: 60 }],
  },
  {
    id: 'tpl-mc-fullbody-expres',
    name: 'Cuerpo completo exprés',
    description: 'Tres superseries para todo el cuerpo en media hora.',
    bodyParts: ['upper legs', 'chest', 'back'],
    technique: 'superserie',
    minimal: true,
    specs: [
      ['1760', '0289'],
      ['1459', '0293'],
      ['0405', { id: '0274', reps: [15, 20] }],
    ],
  },
  {
    id: 'tpl-mc-torso-alemanas',
    name: 'Torso en series alemanas',
    description: 'Press de banca y remo con mancuernas a 10 × 10.',
    bodyParts: ['chest', 'back'],
    technique: 'aleman',
    minimal: true,
    specs: [
      { id: '0289', technique: 'aleman' },
      { id: '0293', technique: 'aleman' },
    ],
  },
]

export const ROUTINE_TEMPLATES: RoutineTemplate[] = DRAFTS.map(({ specs, ...t }, position) => {
  const items = build(t.id, specs)
  return { ...t, position, items, durationMin: estimateMinutes(items) }
})
