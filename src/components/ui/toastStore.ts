import { create } from 'zustand'

export type ToastState = {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
  durationMs: number
} | null

export const useToastStore = create<{ toast: ToastState }>(() => ({ toast: null }))
let nextId = 1

/** Shows a single toast (a new one replaces the current). Used for «Deshacer» and errors. */
export function showToast(options: {
  message: string
  actionLabel?: string
  onAction?: () => void
  durationMs?: number
}) {
  useToastStore.setState({ toast: { id: nextId++, durationMs: 5000, ...options } })
}

export function dismissToast() {
  useToastStore.setState({ toast: null })
}
