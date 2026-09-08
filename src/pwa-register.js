import { registerSW } from 'virtual:pwa-register'

export const updateServiceWorker = registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new Event('mindconnect:pwa-offline-ready'))
  },
  onNeedRefresh() {
    window.dispatchEvent(new Event('mindconnect:pwa-update-ready'))
  },
})