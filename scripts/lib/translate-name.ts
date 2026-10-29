/**
 * Translates dataset exercise names (English) into natural Spanish:
 *   [equipment] [modifiers] [movement] [with/on clauses] [(notes)] [v. N]
 *   → Movement + adjectives (gender/number agreement) + position + laterality + equipment
 *     + «, qualifiers» + clauses + (notes) + v. N
 * Unknown words are kept in English and reported so the dictionary can grow.
 */

export type Head = { es: string; g: 'm' | 'f'; pl?: boolean; dropEquipment?: string[] }
export type Equipment = { es: string; one?: string }

export type Terms = {
  fixes: Record<string, string>
  equipment: Record<string, Equipment>
  heads: Record<string, Head>
  adjectives: Record<string, string>
  position: Record<string, string>
  laterality: Record<string, string>
  qualifiers: Record<string, string>
  words: Record<string, string>
  connectors: Record<string, string>
}

/** `noMovement`: no movement head was recognised (likely an odd name worth an override). */
export type Translation = { es: string; unknown: string[]; noMovement?: boolean }

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Phrase regex that treats hyphenated words as single words. */
const phraseRegex = (phrase: string) => new RegExp(`(?<![\\w-])${escape(phrase)}(?![\\w-])`, 'g')

const byLengthDesc = (a: string, b: string) => b.length - a.length

const NO_MOVEMENT = '__no_movement__'

export function inflect(adjective: string, g: 'm' | 'f', pl = false): string {
  if (adjective.includes(' ')) return adjective
  let out = adjective
  if (out.endsWith('o') && g === 'f') out = `${out.slice(0, -1)}a`
  if (pl) out = /[aeiouáéó]$/.test(out) ? `${out}s` : `${out}es`
  return out
}

const capitalize = (s: string) => (s ? s[0]!.toLocaleUpperCase('es') + s.slice(1) : s)

/** Lower-cases the first letter unless the phrase starts with a proper noun kept capitalised. */
const lowerFirst = (s: string) =>
  /^[A-ZÁÉÍÓÚ][a-záéíóúñ]/.test(s) ? s[0]!.toLowerCase() + s.slice(1) : s

export function createTranslator(terms: Terms, overrides: Record<string, string> = {}) {
  const fixes = Object.keys(terms.fixes).sort(byLengthDesc)
  const equipment = Object.keys(terms.equipment).sort(byLengthDesc)
  const heads = Object.keys(terms.heads).sort(byLengthDesc)
  const connectors = Object.keys(terms.connectors)

  type Kind = 'adjective' | 'position' | 'laterality' | 'qualifier' | 'word' | 'head'
  const tables: [Kind, Record<string, string>][] = [
    ['laterality', terms.laterality],
    ['qualifier', terms.qualifiers],
    ['position', terms.position],
    ['adjective', terms.adjectives],
    ['word', terms.words],
  ]
  const maxPhraseWords = 5

  function normalize(name: string): string {
    let s = ` ${name.toLowerCase().replace(/\s+/g, ' ').trim()} `
    for (const from of fixes) s = s.replace(phraseRegex(from), terms.fixes[from]!)
    return s.trim()
  }

  /** Greedy longest-match of a word list against the phrase tables. */
  function classify(words: string[], unknown: string[]) {
    const out: { kind: Kind | 'number' | 'unknown'; es: string }[] = []
    for (let i = 0; i < words.length;) {
      let matched = false
      for (let n = Math.min(maxPhraseWords, words.length - i); n > 0 && !matched; n--) {
        const phrase = words.slice(i, i + n).join(' ')
        for (const [kind, table] of tables) {
          if (phrase in table) {
            out.push({ kind, es: table[phrase]! })
            i += n
            matched = true
            break
          }
        }
        if (!matched && n === 1) {
          const head = terms.heads[phrase]
          if (head) {
            out.push({ kind: 'head', es: lowerFirst(head.es) })
            i += 1
            matched = true
          }
        }
      }
      if (matched) continue
      const word = words[i]!
      if (/^[\d/°]+$/.test(word)) out.push({ kind: 'number', es: word })
      else if (word !== '-' && word !== 'exercise') {
        out.push({ kind: 'unknown', es: word })
        unknown.push(word)
      }
      i += 1
    }
    return out
  }

  /** Translates a plain noun phrase (clauses, notes) word by word. */
  function translateWords(text: string, unknown: string[]): string {
    return classify(text.split(' ').filter(Boolean), unknown)
      .map((t) => t.es)
      .filter(Boolean)
      .join(' ')
  }

  /** Translates «[equipment] [modifiers] movement [modifiers]». */
  function translateCore(text: string, unknown: string[]): string {
    let rest = ` ${text} `
    let equip: string | undefined
    for (const key of equipment) {
      if (rest.startsWith(` ${key} `)) {
        equip = key
        rest = rest.slice(key.length + 1)
        break
      }
    }

    // The movement is the match that ends last (the English head noun), longest on ties.
    let best: { key: string; start: number; end: number } | undefined
    for (const key of heads) {
      for (const m of rest.matchAll(phraseRegex(key))) {
        const end = m.index + key.length
        if (!best || end > best.end || (end === best.end && key.length > best.key.length)) {
          best = { key, start: m.index, end }
        }
      }
    }

    if (!best) {
      unknown.push(NO_MOVEMENT)
      const words = translateWords(rest.trim(), unknown)
      const eq = equip ? terms.equipment[equip]!.es : ''
      return [words, eq].filter(Boolean).join(' ')
    }

    const head = terms.heads[best.key]!
    const around = `${rest.slice(0, best.start)} ${rest.slice(best.end)}`
    const parts = classify(around.split(' ').filter(Boolean), unknown)
    const pick = (kind: string) => parts.filter((p) => p.kind === kind).map((p) => p.es)

    const laterality = pick('laterality')
    const one = laterality.some((l) => l.includes('una'))
    const equipEs =
      equip && !head.dropEquipment?.includes(equip)
        ? one && terms.equipment[equip]!.one
          ? terms.equipment[equip]!.one
          : terms.equipment[equip]!.es
        : ''

    const complement = [...pick('word'), ...pick('head')].filter(Boolean)
    const qualifiers = pick('qualifier')

    const main = [
      head.es,
      ...pick('adjective').map((a) => inflect(a, head.g, head.pl)),
      ...pick('number'),
      complement.length ? `de ${complement.join(' ')}` : '',
      ...pick('unknown'),
      ...pick('position'),
      ...laterality,
      equipEs,
    ]
      .filter(Boolean)
      .join(' ')

    return qualifiers.length ? `${main}, ${qualifiers.join(', ')}` : main
  }

  function translate(name: string): Translation {
    const override = overrides[name] ?? overrides[name.toLowerCase()]
    if (override) return { es: override, unknown: [] }

    const unknown: string[] = []
    let s = normalize(name)

    let version = ''
    s = s.replace(/\s*v\.\s*(\d+)\s*$/, (_m, n: string) => {
      version = ` v. ${n}`
      return ''
    })

    const notes: string[] = []
    s = s.replace(/\(([^)]*)\)/g, (_m, inner: string) => {
      const t = translateWords(normalize(inner), unknown)
      if (t) notes.push(t)
      return ' '
    })
    s = s
      .replace(/\s+-\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Split off «with …», «on …», «to …» clauses.
    const tokens = s.split(' ')
    const segments: { connector?: string; words: string[] }[] = [{ words: [] }]
    for (const token of tokens) {
      if (connectors.includes(token) && segments.at(-1)!.words.length > 0) {
        segments.push({ connector: token, words: [] })
      } else {
        segments.at(-1)!.words.push(token)
      }
    }

    const [first, ...clauses] = segments
    let es = translateCore(first!.words.join(' '), unknown)
    for (const clause of clauses) {
      const text = clause.words.join(' ')
      const hasHead = heads.some((h) => phraseRegex(h).test(` ${text} `))
      const body = hasHead
        ? lowerFirst(translateCore(text, unknown))
        : translateWords(text, unknown)
      es += ` ${terms.connectors[clause.connector!]} ${body}`
    }
    if (notes.length) es += ` (${notes.join(', ')})`
    es += version

    return {
      es: capitalize(es.replace(/\s+/g, ' ').replace(/ ,/g, ',').trim()),
      unknown: unknown.filter((u) => u !== NO_MOVEMENT),
      noMovement: unknown.includes(NO_MOVEMENT),
    }
  }

  return translate
}
