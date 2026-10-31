import { useEffect, useRef, type RefObject } from 'react'

/**
 * transitions.dev «number pop-in», adapted to a numeric input: when the value changes from
 * outside the field (+/−, preloaded next set), the figure re-enters with a short vertical shift
 * (from below when it grows, from above when it shrinks). Never while the user is typing in it.
 * The motion is the global `.t-num-pop` class in styles/global.css.
 */
export function useNumberPop(ref: RefObject<HTMLElement | null>, value: number | null) {
  const previous = useRef(value)

  useEffect(() => {
    const el = ref.current
    const before = previous.current
    previous.current = value
    if (!el || before === null || value === null || before === value) return
    if (document.activeElement === el) return
    el.dataset.pop = value > before ? 'up' : 'down'
    el.classList.remove('t-num-pop')
    void el.offsetWidth // restart the keyframes
    el.classList.add('t-num-pop')
  }, [ref, value])
}
