"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'

type ConfirmOptions = {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
}

type ConfirmContextType = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<ConfirmOptions>({})
  const resolver = useRef<(v: boolean) => void>()

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options || {})
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const handle = (result: boolean) => {
    setOpen(false)
    resolver.current?.(result)
  }

  // Keyboard handlers (Escape closes, Enter confirms)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handle(false)
      if (e.key === 'Enter') handle(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const value = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => handle(false)} />
          <div className="relative w-full max-w-md mx-4 rounded-xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
            {/* Header */}
            <div className={`flex items-center gap-3 px-5 py-4 border-b rounded-t-xl ${opts.variant === 'danger' ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100'}`}>
              <div className={`p-2 rounded-full ${opts.variant === 'danger' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {opts.variant === 'danger' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <h3 className="text-base font-semibold text-gray-900 flex-1">{opts.title || 'Confirm'}</h3>
              <button onClick={() => handle(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Body */}
            <div className="px-5 py-4">
              {opts.message && (
                <p className="text-sm text-gray-700">{opts.message}</p>
              )}
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => handle(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {opts.cancelText || 'Cancel'}
                </button>
                <button
                  autoFocus
                  onClick={() => handle(true)}
                  className={`px-4 py-2 rounded-md text-white ${
                    opts.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {opts.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
