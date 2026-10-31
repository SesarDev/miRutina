/**
 * Runs `fn` once the page has loaded, a little after, when the browser is idle: background work
 * (catalogue seed, sync client) must never compete with the first screen for the network.
 * Safari lacks requestIdleCallback: a plain timeout there.
 */
export function whenIdle(fn: () => void, { delayMs = 1500, timeoutMs = 2000 } = {}) {
  const idle = () => {
    const ric = (window as { requestIdleCallback?: Window['requestIdleCallback'] })
      .requestIdleCallback
    if (ric) ric(fn, { timeout: timeoutMs })
    else fn()
  }
  const later = () => setTimeout(idle, delayMs)
  if (document.readyState === 'complete') later()
  else window.addEventListener('load', later, { once: true })
}
