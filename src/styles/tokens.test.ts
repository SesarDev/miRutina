import css from './tokens.css?raw'

/** Returns the custom properties declared in the first block opened after `marker`. */
function block(marker: string): Map<string, string> {
  const start = css.indexOf(marker)
  if (start < 0) throw new Error(`No se encuentra ${marker}`)
  const open = css.indexOf('{', start + marker.length - 1)
  let depth = 0
  let end = open
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}') depth--
    if (depth === 0) {
      end = i
      break
    }
  }
  const body = css.slice(open + 1, end)
  const vars = new Map<string, string>()
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    if (m[1] && m[2]) vars.set(m[1], m[2].trim())
  }
  return vars
}

const dark = block("[data-theme='dark'] {")
const lightMedia = block(":root:not([data-theme='dark']) {")
const light = block("[data-theme='light'] {")

// ── OKLCH → sRGB relative luminance (WCAG 2.x) ──
function oklchToLinearRgb(l: number, c: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  return [
    clamp(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    clamp(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    clamp(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ]
}

function luminance(value: string): number {
  const m = /oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(value)
  if (!m) throw new Error(`Color no OKLCH: ${value}`)
  const [r, g, b] = oklchToLinearRgb(Number(m[1]), Number(m[2]), Number(m[3]))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(fg: string, bg: string): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const FEELS = ['--feel-demasiado', '--feel-justo', '--feel-bien', '--feel-puedo-mas', '--feel-poco']

describe.each([
  ['oscuro', dark],
  ['claro', light],
])('tokens de color · tema %s', (_name, t) => {
  const get = (k: string) => {
    const v = t.get(k)
    if (!v) throw new Error(`Falta ${k}`)
    return v
  }

  it.each(['--color-text', '--color-text-2', '--color-text-3'])(
    '%s cumple AA sobre fondo y superficies',
    (k) => {
      for (const bg of ['--color-bg', '--color-surface', '--color-surface-2', '--color-dock']) {
        expect(contrast(get(k), get(bg)), `${k} sobre ${bg}`).toBeGreaterThanOrEqual(4.5)
      }
    },
  )

  it('las cifras principales alcanzan AAA', () => {
    expect(contrast(get('--color-text'), get('--color-bg'))).toBeGreaterThanOrEqual(7)
    expect(contrast(get('--color-on-armband'), get('--color-armband'))).toBeGreaterThanOrEqual(7)
  })

  it('acción principal, banda y oro como texto cumplen AA', () => {
    expect(contrast(get('--color-on-accent'), get('--color-accent'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(get('--color-on-band'), get('--color-band'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(get('--color-on-band-2'), get('--color-band'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(get('--color-accent-ink'), get('--color-bg'))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(FEELS)('%s se lee como texto y como chip', (k) => {
    expect(contrast(get(k), get('--color-bg')), 'como texto').toBeGreaterThanOrEqual(4.5)
    expect(contrast(get('--color-on-feel'), get(k)), 'como chip').toBeGreaterThanOrEqual(4.5)
  })

  it('el foco destaca (≥ 3:1)', () => {
    expect(contrast(get('--color-focus'), get('--color-bg'))).toBeGreaterThanOrEqual(3)
  })
})

describe('coherencia de temas', () => {
  it('el tema claro por preferencia del sistema y el forzado son idénticos', () => {
    expect(Object.fromEntries(lightMedia)).toEqual(Object.fromEntries(light))
  })

  it('claro y oscuro definen las mismas variables', () => {
    expect([...light.keys()].sort()).toEqual([...dark.keys()].sort())
  })

  it('define los tokens de motion de la fase', () => {
    for (const k of [
      '--dur-instant',
      '--dur-fast',
      '--dur-base',
      '--dur-slow',
      '--ease-out',
      '--ease-in-out',
      '--ease-spring',
    ]) {
      expect(css).toContain(`${k}:`)
    }
  })
})
