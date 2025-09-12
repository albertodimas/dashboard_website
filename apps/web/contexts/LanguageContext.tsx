'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { translations, Language, TranslationKey } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Initialize from cookie and then server-side preference if available
  useEffect(() => {
    let done = false
    ;(async () => {
      try {
        // Visitor cookie
        if (typeof document !== 'undefined') {
          const m = document.cookie.match(/(?:^|; )lang=(en|es)(?:;|$)/)
          if (m && (m[1] === 'en' || m[1] === 'es') && !done) {
            setLanguageState(m[1] as Language)
          }
        }
        // Authenticated user preference
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          const userLang = (data?.user?.language || '').toLowerCase()
          if ((userLang === 'en' || userLang === 'es') && !done) {
            setLanguageState(userLang as Language)
          }
        }
      } catch {}
    })()
    return () => { done = true }
  }, [])

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang)

    // Persist for visitors (cookie, 1 year)
    try {
      if (typeof document !== 'undefined') {
        document.cookie = `lang=${lang}; path=/; max-age=31536000`
      }
    } catch {}

    // Try to update language preference in database if user is logged in
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang })
      })
    } catch (error) {
      // Ignore errors, language is already set locally
    }
  }

  const t = (key: TranslationKey): string => {
    const current = (translations as any)[language] as Record<string, string>
    const fallback = (translations as any)['en'] as Record<string, string>
    return current[key] || fallback[key] || (key as string)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
