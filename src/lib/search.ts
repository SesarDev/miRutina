/** Combining diacritical marks left behind by NFD (´ ¨ ˜ …). */
const DIACRITICS = /\p{Diacritic}/gu

/** Lower-case, strip accents and punctuation: «Press de banca (cerrado)» → «press de banca cerrado». */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9°]+/g, ' ')
    .trim()
}

/** Unique normalised words of all the given texts. */
export function toSearchTokens(...texts: string[]): string[] {
  const words = texts.flatMap((t) => normalizeText(t).split(' ')).filter(Boolean)
  return [...new Set(words)]
}
