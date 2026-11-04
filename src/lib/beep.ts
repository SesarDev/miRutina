/**
 * Short tones made with the Web Audio API: no audio files, so they work offline and weigh
 * nothing. Browsers only let a page play sound after a user gesture, so `unlockAudio()` is
 * called on «Serie hecha» (every rest starts after one). iPhone's silent switch mutes them, and
 * with the screen locked the browser freezes timers: the session keeps the screen on.
 */
let context: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null
  context ??= new window.AudioContext()
  return context
}

/** Call from a tap: creates or resumes the audio context so later tones can play. */
export function unlockAudio() {
  const ctx = audio()
  if (ctx?.state === 'suspended') void ctx.resume()
}

function tone(
  ctx: AudioContext,
  frequency: number,
  startSec: number,
  durationSec: number,
  volume: number,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  const t0 = ctx.currentTime + startSec
  // Quick attack and release: no clicks.
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01)
  gain.gain.setValueAtTime(volume, t0 + durationSec - 0.04)
  gain.gain.linearRampToValueAtTime(0, t0 + durationSec)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + durationSec + 0.02)
}

/** End of a rest: two rising tones, clear over gym noise. */
export function playRestEnd() {
  const ctx = audio()
  if (!ctx || ctx.state !== 'running') return
  tone(ctx, 880, 0, 0.16, 0.35)
  tone(ctx, 1320, 0.19, 0.26, 0.35)
}

/** One of the last seconds of a rest: a short, quieter tick. */
export function playCountdownTick() {
  const ctx = audio()
  if (!ctx || ctx.state !== 'running') return
  tone(ctx, 660, 0, 0.08, 0.18)
}
