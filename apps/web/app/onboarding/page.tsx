'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OperationModeSelector from '@/components/OperationModeSelector'
import { useLanguage } from '@/contexts/LanguageContext'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'RESERVA' | 'PROYECTO'>('RESERVA')
  const { t } = useLanguage()

  useEffect(() => {
    // Ensure user is authenticated and load current business
    const init = async () => {
      try {
        const me = await fetch('/api/auth/me')
        if (!me.ok) throw new Error('not-auth')
        const res = await fetch('/api/dashboard/business')
        if (res.ok) {
          const biz = await res.json()
          const currentMode = biz?.settings?.operationMode
          if (currentMode === 'PROYECTO' || currentMode === 'RESERVA') setMode(currentMode)
          // If already configured, go to dashboard
          if (biz?.settings?.needsConfiguration === false) {
            router.push('/dashboard')
            return
          }
        }
        setLoading(false)
      } catch {
        router.push('/login')
      }
    }
    init()
  }, [router])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/business')
      const biz = await res.json()
      const updatedSettings = { ...(biz.settings || {}), operationMode: mode, needsConfiguration: false }
      const r = await fetch('/api/dashboard/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings }),
      })
      if (!r.ok) throw new Error('save-failed')
      router.push('/dashboard')
    } catch {
      alert('No se pudo guardar. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando…</div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl w-full bg-white rounded-xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-2">{t('onboardingTitle') || 'Set up your business'}</h1>
        <p className="text-sm text-gray-600 mb-4">{t('operationModeDesc')}</p>
        <OperationModeSelector value={mode} onChange={setMode} />
        <button
          onClick={save}
          disabled={saving}
          className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
        >
          {saving ? (t('saving') || 'Saving...') : (t('continue') || 'Continue')}
        </button>
      </div>
    </div>
  )
}
