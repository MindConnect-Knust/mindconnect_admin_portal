import { useEffect, useState } from 'react'
import { Download, RefreshCcw, WifiOff, X } from 'lucide-react'
import { updateServiceWorker } from '../../pwa-register.js'

export default function PwaStatus() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [updateReady, setUpdateReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const goOnline = () => setIsOffline(false)
    const goOffline = () => setIsOffline(true)
    const onInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const onUpdateReady = () => setUpdateReady(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    window.addEventListener('beforeinstallprompt', onInstallPrompt)
    window.addEventListener('mindconnect:pwa-update-ready', onUpdateReady)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('beforeinstallprompt', onInstallPrompt)
      window.removeEventListener('mindconnect:pwa-update-ready', onUpdateReady)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  if (isOffline) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg" role="status">
        <WifiOff size={16} /> You're offline. Live admin data is unavailable.
      </div>
    )
  }

  if (updateReady && !dismissed) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg" role="status">
        <span className="font-medium">A new portal version is ready.</span>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white" onClick={() => updateServiceWorker(true)}>
          <RefreshCcw size={14} /> Update
        </button>
        <button aria-label="Dismiss update notice" className="text-slate-400 hover:text-slate-700" onClick={() => setDismissed(true)}>
          <X size={16} />
        </button>
      </div>
    )
  }

  if (installPrompt) {
    return (
      <button className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg" onClick={install}>
        <Download size={16} /> Install MindConnect Admin
      </button>
    )
  }

  return null
}