/**
 * transitions.dev «error state shake»: replays a short horizontal shake on each element (the
 * global `.t-shake` class). The red border and the message stay as the static cue; the shake is
 * only the moment of noticing. With reduced motion the distance tokens are 0, so nothing moves.
 */
export function shake(elements: Iterable<Element>) {
  for (const el of elements) {
    if (!(el instanceof HTMLElement)) continue
    el.classList.remove('t-shake')
    void el.offsetWidth // restart the keyframes
    el.classList.add('t-shake')
  }
}
