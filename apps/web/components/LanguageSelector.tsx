'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center">
      <button
        onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
      >
        <span className="text-lg">
          {language === 'en' ? '🇺🇸' : '🇪🇸'}
        </span>
        <span>{language === 'en' ? 'EN' : 'ES'}</span>
      </button>
    </div>
  )
}