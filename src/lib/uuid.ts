/**
 * UUID v4. `crypto.randomUUID` only exists in secure contexts (HTTPS or localhost); the phone
 * opening the dev server at http://192.168.x.x is not one, so fall back to getRandomValues,
 * which is available everywhere.
 */
export function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6]! & 0x0f) | 0x40 // version 4
  b[8] = (b[8]! & 0x3f) | 0x80 // RFC 4122 variant
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/**
 * A stable UUID for a string: the same input gives the same id on every device (built-in
 * routines get one so planned workouts and sessions can point at them; Supabase wants UUIDs).
 * Two 64-bit FNV-1a hashes, with the version (5) and variant bits set.
 */
export function uuidFromString(input: string): string {
  const fnv = (seed: bigint) => {
    let h = seed
    for (const ch of input) {
      h ^= BigInt(ch.codePointAt(0)!)
      h = (h * 0x100000001b3n) & 0xffffffffffffffffn
    }
    return h.toString(16).padStart(16, '0')
  }
  const hex = (fnv(0xcbf29ce484222325n) + fnv(0x84222325cbf29ce4n)).split('')
  hex[12] = '5'
  hex[16] = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)
  const h = hex.join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
