/** Test double of `virtual:pwa-register/react` (the module only exists in Vite builds). */
export function useRegisterSW() {
  const noop = () => {}
  return {
    needRefresh: [false, noop] as const,
    offlineReady: [false, noop] as const,
    updateServiceWorker: async () => {},
  }
}
