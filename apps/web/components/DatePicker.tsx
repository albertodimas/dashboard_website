'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useEffect, useRef } from 'react'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function DatePicker({ value, onChange, placeholder, className = '' }: DatePickerProps) {
  const { language } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const localeMap: Record<string, string> = { en: 'en-US', es: 'es-ES' }
  const locale = localeMap[language] || 'en-US'
  
  // Set the language attribute when language changes
  useEffect(() => {
    if (inputRef.current) {
      // Force the browser to use the correct locale
      inputRef.current.setAttribute('lang', locale)
      
      // For some browsers, we need to set the locale on the parent element too
      const parent = inputRef.current.parentElement
      if (parent) {
        parent.setAttribute('lang', locale)
      }
    }
  }, [locale])

  return (
    <input
      ref={inputRef}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      lang={locale}
      placeholder={placeholder}
      data-lang={locale}
    />
  )
}
