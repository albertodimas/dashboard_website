"use client"

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: string; type: ToastType; message: string }
type ToastContextType = { show: (message: string, type?: ToastType, timeoutMs?: number) => void }

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.show
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: ToastType = 'info', timeoutMs: number = 3000) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setToasts((prev) => [...prev, { id, type, message }])
    if (timeoutMs > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, timeoutMs)
    }
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[1100] space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`min-w-[240px] max-w-sm rounded-md shadow-md ring-1 ring-black/5 px-4 py-3 text-sm text-white ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
