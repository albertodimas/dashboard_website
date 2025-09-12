'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const flagMap: Record<string, string> = { en: '🇺🇸', es: '🇪🇸' }
  const labelMap: Record<string, string> = { en: 'EN', es: 'ES' }

  return (
    <div className="flex items-center">
      <button
        onClick={() => {
          const map: Record<string, 'en'|'es'> = { en: 'es', es: 'en' }
          setLanguage((map[language] || 'en') as any)
        }}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
      >
        <span className="text-lg">{flagMap[language] || '🇺🇸'}</span>
        <span>{labelMap[language] || 'EN'}</span>
      </button>
    </div>
  )
}
