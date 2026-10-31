/**
 * The armband hand-off (DESIGN.md: the app's one motion moment). The store actions that move
 * the armband, and the reorder buttons, capture the session layout right before the change;
 * SesionPage plays it after the commit: rows and cards move and resize into place and new rows
 * fade in (one GSAP Flip, under 300 ms), while the armband's fill cross-fades between rows in CSS
 * (`.set` in Session.module.css; GSAP cannot interpolate the oklch() colours).
 */
import { capture, play, type FlipCapture } from '@/motion/flip'

const ROOT = '[data-session-flip]'

let pending: FlipCapture | null = null

const targets = () => document.querySelector(ROOT)?.querySelectorAll('[data-flip-id]') ?? []

export function captureSessionLayout() {
  pending = capture(targets())
}

export function playSessionLayout() {
  const captured = pending
  pending = null
  play(captured, targets(), { nested: true })
}
