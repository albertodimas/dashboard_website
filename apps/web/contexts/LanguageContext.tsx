'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { translations, Language, TranslationKey } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang)
    
    // Try to update language preference in database if user is logged in
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
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
