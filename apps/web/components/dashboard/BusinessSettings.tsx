'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { useLanguage } from '@/contexts/LanguageContext'
import { Globe, Save, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react'
import { THEME_PRESETS } from './theme-presets'

interface BusinessThemeSettings {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
  fontFamily?: string
  buttonStyle?: string
}

interface BusinessUiSettings {
  chipsSticky?: boolean
  paginationStyle?: string
  heroOverlay?: string
  heroButtonStyle?: string
  useTranslucentHeroButtons?: boolean
  heroButtons?: {
    showPrimary?: boolean
    primaryText?: string
    showServices?: boolean
    servicesText?: string
    showGallery?: boolean
    galleryText?: string
    showAuth?: boolean
  }
  cardRadius?: string
  shadowStyle?: string
  typographyScale?: string
  bodyScale?: string
  useGradientButtons?: boolean
  showMobileStickyCTA?: boolean
  showDesktopFloatingDirection?: boolean
  tagline?: string
}

interface BusinessSettingsObject {
  theme?: BusinessThemeSettings
  ui?: BusinessUiSettings
}

interface Business {
  slug: string
  websiteUrl?: string
  customSlug?: string | null
  customDomain?: string | null
  description?: string | null
  settings?: BusinessSettingsObject
}

interface BusinessSettingsProps {
  business: Business
  onUpdate: (data: Partial<Business>) => void
}

export default function BusinessSettings({ business, onUpdate }: BusinessSettingsProps) {
  const toast = useToast()
  const { t } = useLanguage()
  const [websiteUrl, setWebsiteUrl] = useState(business.websiteUrl || '')
  const [customSlug, setCustomSlug] = useState(business.customSlug || '')
  const [customDomain, setCustomDomain] = useState(business.customDomain || '')
  const [domainStatus, setDomainStatus] = useState<'idle'|'checking'|'valid'|'invalid'>('idle')
  const [domainMsg, setDomainMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [slugError, setSlugError] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle')
  const [slugSuggestion, setSlugSuggestion] = useState('')
  
  // Color theme states
  const currentTheme = business.settings?.theme || {}
  const [primaryColor, setPrimaryColor] = useState(currentTheme.primaryColor || '#3B82F6')
  const [secondaryColor, setSecondaryColor] = useState(currentTheme.secondaryColor || '#1F2937')
  const [accentColor, setAccentColor] = useState(currentTheme.accentColor || '#10B981')
  const [backgroundColor, setBackgroundColor] = useState(currentTheme.backgroundColor || '#FFFFFF')
  const eq = (a: string, b: string) => (a || '').toLowerCase() === (b || '').toLowerCase()
  // Presets moved to a shared module
  const PRESETS = THEME_PRESETS
  
  // Typography and button style states
  const [fontFamily, setFontFamily] = useState(currentTheme.fontFamily || 'inter')
  const [buttonStyle, setButtonStyle] = useState(currentTheme.buttonStyle || 'rounded')
  const fontClass = (ff: string) => (
    ff === 'inter' ? 'font-["Inter"]' :
    ff === 'poppins' ? 'font-["Poppins"]' :
    ff === 'lato' ? 'font-["Lato"]' :
    ff === 'opensans' ? 'font-["Open_Sans"]' :
    ff === 'raleway' ? 'font-["Raleway"]' :
    ff === 'nunito' ? 'font-["Nunito"]' :
    ff === 'merriweather' ? 'font-["Merriweather"]' :
    ff === 'sourcesans' ? 'font-["Source_Sans_Pro"]' :
    ff === 'montserrat' ? 'font-["Montserrat"]' :
    ff === 'roboto' ? 'font-["Roboto"]' :
    ff === 'playfair' ? 'font-["Playfair_Display"]' :
    ff === 'worksans' ? 'font-["Work_Sans"]' :
    'font-["Inter"]'
  )
  const FONT_OPTIONS = [
    { value: 'inter', label: 'Inter' },
    { value: 'poppins', label: 'Poppins' },
    { value: 'lato', label: 'Lato' },
    { value: 'opensans', label: 'Open Sans' },
    { value: 'raleway', label: 'Raleway' },
    { value: 'nunito', label: 'Nunito' },
    { value: 'merriweather', label: 'Merriweather' },
    { value: 'sourcesans', label: 'Source Sans Pro' },
    { value: 'montserrat', label: 'Montserrat' },
    { value: 'roboto', label: 'Roboto' },
    { value: 'playfair', label: 'Playfair Display' },
    { value: 'worksans', label: 'Work Sans' },
  ] as const

  const BUTTON_STYLES = [
    { value: 'soft', label: t('btnStyle_soft') },
    { value: 'rounded', label: t('btnStyle_rounded') },
    { value: 'square', label: t('btnStyle_square') },
    { value: 'pill', label: t('btnStyle_pill') },
    { value: 'soft-rounded', label: t('btnStyle_softRounded') },
    { value: 'outlined', label: t('btnStyle_outlined') },
    { value: 'shadow', label: t('btnStyle_shadow') },
    { value: '3d', label: t('btnStyle_3d') },
    { value: 'gradient', label: t('btnStyle_gradient') },
    { value: 'outline-dashed', label: t('btnStyle_outlineDashed') },
    { value: 'ghost', label: t('btnStyle_ghost') },
    { value: 'link', label: t('btnStyle_link') },
  ] as const

  // UI layout options
  const currentUi = business.settings?.ui || {}
  const [chipsSticky, setChipsSticky] = useState(currentUi.chipsSticky !== false)
  const [paginationStyle, setPaginationStyle] = useState(currentUi.paginationStyle || 'numbered')
  const [heroOverlay, setHeroOverlay] = useState(currentUi.heroOverlay || 'strong')
  const [heroButtonStyle, setHeroButtonStyle] = useState(currentUi.heroButtonStyle || '')
  const [useTranslucentHeroButtons, setUseTranslucentHeroButtons] = useState(!!currentUi.useTranslucentHeroButtons)
  const [heroButtons, setHeroButtons] = useState({
    showPrimary: currentUi.heroButtons?.showPrimary !== false,
    primaryText: currentUi.heroButtons?.primaryText || '',
    showServices: currentUi.heroButtons?.showServices !== false,
    servicesText: currentUi.heroButtons?.servicesText || '',
    showGallery: currentUi.heroButtons?.showGallery !== false,
    galleryText: currentUi.heroButtons?.galleryText || '',
    showAuth: currentUi.heroButtons?.showAuth !== false,
  })
  const [cardRadius, setCardRadius] = useState(currentUi.cardRadius || 'xl')
  const [shadowStyle, setShadowStyle] = useState(currentUi.shadowStyle || 'soft')
  const [typographyScale, setTypographyScale] = useState(currentUi.typographyScale || 'M')
  const [bodyScale, setBodyScale] = useState(currentUi.bodyScale || 'M')
  const [useGradientButtons, setUseGradientButtons] = useState(currentUi.useGradientButtons !== false)
  const [showMobileStickyCTA, setShowMobileStickyCTA] = useState(currentUi.showMobileStickyCTA !== false)
  const [showDesktopFloatingDirection, setShowDesktopFloatingDirection] = useState(currentUi.showDesktopFloatingDirection !== false)
  const [tagline, setTagline] = useState(currentUi.tagline || '')
  const TAGLINE_LIMIT = 80
  const taglineCount = (tagline || '').length
  const taglineTooLong = taglineCount > TAGLINE_LIMIT

  // Clamp initial tagline if it comes longer than allowed
  useEffect(() => {
    if ((tagline || '').length > TAGLINE_LIMIT) {
      setTagline((tagline || '').slice(0, TAGLINE_LIMIT))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const publicUrl = business.customSlug 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${business.customSlug}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/business/${business.slug}`
  
  const previewUrl = customSlug 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${customSlug}`
    : publicUrl;

  const validateSlug = (value: string) => {
    // Remove leading/trailing slashes and spaces
    const cleaned = value.trim().replace(/^\/+|\/+$/g, '')
    
    // If empty, that's valid (clears the custom slug)
    if (!cleaned) {
      setSlugError('')
      return true
    }
    
    // Must have at least one character
    if (cleaned.length < 1) {
      setSlugError('URL path cannot be empty')
      return false
    }
    
    // Don't allow certain reserved paths
    const reserved = ['api', 'admin', 'dashboard', 'login', 'register', 'business', 'b', '_next', 'public', 'assets', 'cliente']
    const firstSegment = cleaned.split('/')[0]
    
    if (reserved.includes(firstSegment.toLowerCase())) {
      setSlugError(`Cannot use reserved path: ${firstSegment}`)
      return false
    }
    
    // Check for valid characters (letters, numbers, hyphens, and slashes)
    if (!/^[a-zA-Z0-9\-\/]+$/.test(cleaned)) {
      setSlugError('Only letters, numbers, hyphens, and slashes allowed')
      return false
    }
    
    // No consecutive slashes
    if (cleaned.includes('//')) {
      setSlugError('Cannot have consecutive slashes')
      return false
    }
    
    setSlugError('')
    return true
  }

  const checkSlugAvailability = async (value: string) => {
    const cleaned = value.trim().replace(/^\/+|\/+$/g, '')
    if (!cleaned) { setSlugStatus('idle'); setSlugSuggestion(''); return }
    setSlugStatus('checking')
    try {
      const res = await fetch(`/api/dashboard/business/check-slug?slug=${encodeURIComponent(cleaned)}`)
      if (!res.ok) { setSlugStatus('idle'); return }
      const data = await res.json()
      if (data.available) {
        setSlugStatus('available')
        setSlugSuggestion('')
      } else {
        setSlugStatus('taken')
        setSlugSuggestion(data.suggestion || '')
        if (!slugError && data.message) setSlugError(data.message)
      }
    } catch {
      setSlugStatus('idle')
    }
  }

  const handleSave = async () => {
    const trimmedTagline = taglineTooLong ? tagline.slice(0, TAGLINE_LIMIT) : tagline
    if (taglineTooLong) {
      toast(`Hero Tagline truncado a ${TAGLINE_LIMIT} caracteres`, 'info')
    }
    // Validate slug before saving
    const cleanedSlug = customSlug.trim().replace(/^\/+|\/+$/g, '')
    
    console.log('Saving with cleanedSlug:', cleanedSlug)
    
    if (cleanedSlug && !validateSlug(cleanedSlug)) {
      console.log('Validation failed for slug:', cleanedSlug)
      return
    }
    
    setIsSaving(true)
    setSlugError('') // Clear any previous errors
    
    try {
      const requestBody = {
        websiteUrl,
        customSlug: cleanedSlug || null,
        customDomain,
        theme: {
          primaryColor,
          secondaryColor,
          accentColor,
          backgroundColor,
          fontFamily,
          buttonStyle
        },
        ui: {
          chipsSticky,
          paginationStyle,
          heroOverlay,
          heroButtonStyle,
          useTranslucentHeroButtons,
          heroButtons,
          cardRadius,
          shadowStyle,
          typographyScale,
          bodyScale,
          useGradientButtons,
          showMobileStickyCTA,
          showDesktopFloatingDirection,
          tagline: trimmedTagline
        }
      }
      
      console.log('Sending request with body:', requestBody)
      
      const response = await fetch(`/api/dashboard/business`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      console.log('Response:', { status: response.status, data })

      if (response.ok) {
        onUpdate({ 
          websiteUrl, 
          customSlug: cleanedSlug, 
          customDomain,
          theme: {
            primaryColor,
            secondaryColor,
            accentColor,
            backgroundColor,
            fontFamily,
            buttonStyle
          },
          ui: {
            chipsSticky,
            paginationStyle,
            heroOverlay,
            heroButtonStyle,
            useTranslucentHeroButtons,
            heroButtons,
            cardRadius,
            shadowStyle,
            typographyScale,
            bodyScale,
            useGradientButtons,
            showMobileStickyCTA,
            showDesktopFloatingDirection,
            tagline: trimmedTagline
          }
        })
        setTagline(trimmedTagline)
        setCustomSlug(data.customSlug || '')
        toast('✅ Settings saved successfully!', 'success')
      } else {
        console.error('Server error:', data)
        if (data.message?.includes('Unique constraint') || data.error?.includes('already taken')) {
          setSlugError('This URL is already taken by another business')
        } else {
          setSlugError(data.error || data.message || 'Failed to save settings')
          toast(`❌ Error: ${data.error || data.message || 'Failed to save settings'}`, 'error')
        }
      }
    } catch (error) {
      console.error('Network error saving settings:', error)
      setSlugError('Network error occurred')
      toast('❌ Network error occurred', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="text-blue-600" size={24} />
        <h2 className="text-2xl font-bold">{t('websiteSettingsTitle') || 'Website Settings'}</h2>
      </div>

      <div className="space-y-6">
        {/* Custom URL Path */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('customUrlPathOptional') || 'Custom URL Path (Optional)'}
          </label>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-500">{typeof window !== 'undefined' ? window.location.origin : ''}/</span>
            <input
              type="text"
              value={customSlug}
              onChange={(e) => {
                setCustomSlug(e.target.value)
                const ok = validateSlug(e.target.value)
                if (ok) {
                  checkSlugAvailability(e.target.value)
                } else {
                  setSlugStatus('idle')
                }
              }}
              placeholder="e.g., trade/welcome or my-business"
              className={`flex-1 p-3 border rounded-lg ${
                slugError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {slugStatus === 'checking' && (
              <span className="text-xs text-gray-500">Checking…</span>
            )}
          </div>
          {slugError && (
            <div className="flex items-center gap-1 text-red-600 text-sm mb-2">
              <AlertCircle size={16} />
              <span>{slugError}</span>
            </div>
          )}
          {!slugError && slugStatus === 'taken' && (
            <div className="text-red-600 text-sm mb-2">This URL is already taken{slugSuggestion ? ` — try "${slugSuggestion}"` : ''}</div>
          )}
          {!slugError && slugStatus === 'available' && (
            <div className="text-green-600 text-sm mb-2">URL available</div>
          )}
          <p className="text-sm text-gray-500">
            Create a custom URL for your business page (e.g., yoursite.com/trade/welcome)
          </p>
        </div>

        {/* Current URL */}
        <div>
          <label className="block text sm font-medium text-gray-700 mb-2">
            {t('currentLandingUrl') || 'Your Current Landing Page URL'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={previewUrl}
              readOnly
              className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={copyToClipboard}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              title="Copy URL"
            >
              {copied ? <Check className="text-green-600" size={20} /> : <Copy size={20} />}
            </button>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            This is your business landing page URL that customers can visit
          </p>
        </div>

        {/* Custom Domain (Future Feature) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Domain (Optional)
          </label>
          <input
            type="text"
            value={customDomain}
            onChange={async (e) => {
              const v = e.target.value.trim().toLowerCase()
              setCustomDomain(v)
              if (!v) { setDomainStatus('idle'); setDomainMsg(''); return }
              setDomainStatus('checking'); setDomainMsg('')
              try {
                const res = await fetch(`/api/dashboard/domain/check?domain=${encodeURIComponent(v)}`)
                const data = await res.json()
                if (data.valid) { setDomainStatus('valid'); setDomainMsg('Looks good. Configure DNS and save.') }
                else { setDomainStatus('invalid'); setDomainMsg(data.message || 'Invalid domain') }
              } catch {
                setDomainStatus('invalid'); setDomainMsg('Failed to validate domain')
              }
            }}
            placeholder="e.g., mybusiness.com"
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Configure a custom domain for your landing page (requires DNS configuration)
          </p>
          {domainStatus === 'checking' && (
            <p className="text-xs text-gray-500 mt-1">Checking domain…</p>
          )}
          {domainStatus === 'valid' && (
            <div className="text-xs text-green-600 mt-1">{domainMsg}</div>
          )}
          {domainStatus === 'invalid' && (
            <div className="text-xs text-red-600 mt-1">{domainMsg}</div>
          )}
        </div>

        {/* Theme Customization */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🎨 Theme Customization</h3>
          <p className="text-sm text-gray-600 mb-6">
            Customize the colors of your business landing page to match your brand
          </p>

          {/* Theme Presets */}
          <div className="mb-8">
            <h4 className="text-md font-semibold mb-1">🎯 Quick Theme Presets</h4>
            <p className="text-sm text-gray-600">
              Choose from our professionally designed color combinations
            </p>
            {/* Selected label removed; visual highlight is enough */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESETS.map(({ name, p, s, a, b }) => {
                const isActive = eq(primaryColor,p) && eq(secondaryColor,s) && eq(accentColor,a) && eq(backgroundColor,b)
                return (
                  <div
                    key={name}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${isActive ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400' : 'border-gray-200 hover:border-blue-300'}`}
                    onClick={() => { setPrimaryColor(p); setSecondaryColor(s); setAccentColor(a); setBackgroundColor(b) }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{name}</span>
                      <div className="flex items-center gap-2">
                        {/* Badge removed; card highlight indicates selection */}
                        <div className="flex gap-1">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p }}></div>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s }}></div>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: a }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 rounded w-full" style={{ background: `linear-gradient(90deg, ${p} 0%, ${a} 100%)` }} />
                  </div>
                )
              })}
            </div>
            </div>

          {/* Custom Colors Section */}
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold mb-4">🎨 Custom Colors</h4>
            <p className="text-sm text-gray-600 mb-6">
              Fine-tune your colors manually for the perfect brand match
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Main brand color for buttons and highlights
              </p>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#1F2937"
                  className="flex-1 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Secondary color for headers and text
              </p>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#10B981"
                  className="flex-1 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Accent color for special elements and CTAs
              </p>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Main background color for the page
              </p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div 
              className="p-6 rounded-lg shadow-sm"
              style={{ backgroundColor }}
            >
              <h3 
                className="text-xl font-bold mb-2"
                style={{ color: secondaryColor }}
              >
                Your Business Name
              </h3>
              <p 
                className="text-sm mb-4"
                style={{ color: secondaryColor, opacity: 0.7 }}
              >
                This is how your brand colors will look on your landing page
              </p>
              <div className="flex gap-2 flex-wrap">
                <button 
                  className="px-4 py-2 rounded text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Primary Button
                </button>
                <button 
                  className="px-4 py-2 rounded text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  Accent Button
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Button Styles */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🔘 Button Styles</h3>
          <p className="text-sm text-gray-600 mb-4">Elige la forma/estilo de tus botones.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BUTTON_STYLES.map(({ value, label }) => {
              const active = buttonStyle === value
              const baseTile = `p-4 border-2 rounded-lg cursor-pointer transition ${active ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400' : 'border-gray-200 hover:border-blue-300'}`
              const sampleCommon = 'px-4 py-2 font-medium'
              const radius = (
                value === 'rounded' ? 'rounded-lg' :
                value === 'square' ? '' :
                value === 'pill' ? 'rounded-full' :
                value === 'soft-rounded' ? 'rounded-2xl' :
                'rounded-lg'
              )
              const isOutlined = value === 'outlined'
              const isDashed = value === 'outline-dashed'
              const isGhost = value === 'ghost'
              const isLink = value === 'link'
              const isShadow = value === 'shadow'
              const is3d = value === '3d'
              const isGradient = value === 'gradient'
              const borderOnly = isOutlined || isDashed || isGhost || isLink
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setButtonStyle(value)}
                  className={baseTile}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`${sampleCommon} ${radius} ${isOutlined ? 'border-2' : ''} ${isDashed ? 'border-2 border-dashed' : ''} ${isGhost ? 'border-2 border-transparent' : ''} ${isLink ? 'underline' : ''} ${borderOnly ? '' : 'text-white'} ${isShadow ? 'shadow-lg' : ''} ${is3d ? 'shadow-[0_4px_0_rgba(0,0,0,0.25)]' : ''}`}
                      style={{
                        background: borderOnly ? 'transparent' : (isGradient ? `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)` : primaryColor),
                        borderColor: (isOutlined || isDashed) ? primaryColor : undefined,
                        color: borderOnly ? primaryColor : undefined
                      }}
                    >
                      Button
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Hero/Banner Button Styles */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-2">{t('heroButtonStylesTitle') || '🔘 Hero/Banner Button Styles'}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('heroButtonStylesDesc') || 'Optionally define a different style just for the banner CTAs (if not set, they use the global style).'}</p>

          {/* Hero Tagline moved here */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('heroTaglineTitle') || 'Hero Tagline'}</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value.slice(0, TAGLINE_LIMIT))}
              placeholder="Servicios profesionales de la más alta calidad"
              className={`w-full p-3 border rounded-lg ${taglineTooLong ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} focus:ring-1`}
              aria-invalid={taglineTooLong}
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-500">{t('heroTaglineHelp') || 'Short text under the business name. Leave empty to use description or default.'}</p>
              <span className={`text-xs font-medium ${taglineTooLong ? 'text-red-600' : 'text-gray-500'}`}>{taglineCount}/{TAGLINE_LIMIT}</span>
            </div>
            {taglineTooLong && (
              <p className="text-xs text-red-600 mt-1">Máximo {TAGLINE_LIMIT} caracteres.</p>
            )}
          </div>
          {/* Banner buttons configuration */}
          <div className="mb-6 space-y-4">
            <h4 className="text-md font-semibold">{t('heroButtonsConfigTitle') || 'Hero/Banner Buttons'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 items-center">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={heroButtons.showPrimary} onChange={(e) => setHeroButtons(v => ({...v, showPrimary: e.target.checked}))} />
                <span className="text-sm text-gray-700">{t('showPrimaryCta') || 'Show primary CTA'}</span>
              </label>
              <input
                type="text"
                value={heroButtons.primaryText}
                onChange={(e) => setHeroButtons(v => ({...v, primaryText: e.target.value}))}
                placeholder={t('primaryCtaLabel') || 'Primary CTA label (optional)'}
                className="w-full p-2 border border-gray-300 rounded"
              />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={heroButtons.showServices} onChange={(e) => setHeroButtons(v => ({...v, showServices: e.target.checked}))} />
                <span className="text-sm text-gray-700">{t('showServicesButton') || 'Show Services button'}</span>
              </label>
              <input
                type="text"
                value={heroButtons.servicesText}
                onChange={(e) => setHeroButtons(v => ({...v, servicesText: e.target.value}))}
                placeholder={t('servicesButtonLabel') || 'Services button label (optional)'}
                className="w-full p-2 border border-gray-300 rounded"
              />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={heroButtons.showGallery} onChange={(e) => setHeroButtons(v => ({...v, showGallery: e.target.checked}))} />
                <span className="text-sm text-gray-700">{t('showGalleryButton') || 'Show Gallery button'}</span>
              </label>
              <div>
                <input
                  type="text"
                  value={heroButtons.galleryText}
                  onChange={(e) => setHeroButtons(v => ({...v, galleryText: e.target.value}))}
                  placeholder={t('galleryButtonLabel') || 'Gallery button label (optional)'}
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">{t('noteGalleryOnlyIfAvailable') || 'Shown only if gallery exists'}</p>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={heroButtons.showAuth} onChange={(e) => setHeroButtons(v => ({...v, showAuth: e.target.checked}))} />
                <span className="text-sm text-gray-700">{t('showAuthButton') || 'Show Sign In/My Portal button'}</span>
              </label>
            </div>
          </div>
          {/* Translucent oval buttons toggle (chips style) */}
          <div className="mb-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={useTranslucentHeroButtons}
                onChange={(e) => setUseTranslucentHeroButtons(e.target.checked)}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium text-gray-800">{t('useTranslucentHeroButtons') || 'Use translucent oval buttons (chips style)'}</div>
                <div className="text-xs text-gray-500">{t('useTranslucentHeroButtonsDesc') || 'Render hero CTAs as oval chips with translucent background like the badges above.'}</div>
              </div>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Inherit option */}
            <button
              type="button"
              onClick={() => setHeroButtonStyle('')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${heroButtonStyle === '' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400' : 'border-gray-200 hover:border-blue-300'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{t('useGlobalButtonStyle')}</span>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-4 py-2 font-medium rounded-lg ${['outlined','outline-dashed','ghost','link'].includes(buttonStyle) ? '' : 'text-white'}`}
                  style={{
                    background: ['outlined','outline-dashed','ghost','link'].includes(buttonStyle)
                      ? 'transparent'
                      : (useGradientButtons || buttonStyle === 'gradient')
                        ? `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)`
                        : primaryColor,
                    borderColor: ['outlined','outline-dashed'].includes(buttonStyle) ? primaryColor : undefined,
                    color: ['outlined','outline-dashed','ghost','link'].includes(buttonStyle) ? primaryColor : undefined
                  }}
                >
                  CTA Banner
                </span>
              </div>
            </button>
            {BUTTON_STYLES.map(({ value, label }) => {
              const active = heroButtonStyle === value
              const baseTile = `p-4 border-2 rounded-lg cursor-pointer transition ${active ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400' : 'border-gray-200 hover:border-blue-300'}`
              const sampleCommon = 'px-4 py-2 font-medium'
              const radius = (
                value === 'rounded' ? 'rounded-lg' :
                value === 'square' ? '' :
                value === 'pill' ? 'rounded-full' :
                value === 'soft-rounded' ? 'rounded-2xl' :
                'rounded-lg'
              )
              const isOutlined = value === 'outlined'
              const isDashed = value === 'outline-dashed'
              const isGhost = value === 'ghost'
              const isLink = value === 'link'
              const isShadow = value === 'shadow'
              const is3d = value === '3d'
              const isGradient = value === 'gradient'
              const borderOnly = isOutlined || isDashed || isGhost || isLink
              return (
                <button
                  key={`hero-${value}`}
                  type="button"
                  onClick={() => setHeroButtonStyle(value)}
                  className={baseTile}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`${sampleCommon} ${radius} ${isOutlined ? 'border-2' : ''} ${isDashed ? 'border-2 border-dashed' : ''} ${isGhost ? 'border-2 border-transparent' : ''} ${isLink ? 'underline' : ''} ${borderOnly ? '' : 'text-white'} ${isShadow ? 'shadow-lg' : ''} ${is3d ? 'shadow-[0_4px_0_rgba(0,0,0,0.25)]' : ''}`}
                      style={{
                        background: borderOnly ? 'transparent' : (isGradient ? `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)` : primaryColor),
                        borderColor: (isOutlined || isDashed) ? primaryColor : undefined,
                        color: borderOnly ? primaryColor : undefined
                      }}
                    >
                      CTA Banner
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* UI Layout Options */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">UI Layout Options</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Sticky category chips on mobile</label>
              <input type="checkbox" checked={chipsSticky} onChange={(e) => setChipsSticky(e.target.checked)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pagination style</label>
              <select
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={paginationStyle}
                onChange={(e) => setPaginationStyle(e.target.value)}
              >
                <option value="numbered">Numbered</option>
                <option value="infinite">Infinite scroll</option>
              </select>
            </div>
          </div>
        </div>

        {/* Typography Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Typography Settings</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Selecciona una tipografía haciendo clic en una tarjeta.</p>

            {/* Visual font previews */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Vista previa de tipografías</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {FONT_OPTIONS.map(({ value, label }) => {
                  const active = fontFamily === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFontFamily(value)}
                      className={`text-left p-4 border-2 rounded-lg transition focus:outline-none ${active ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{label}</span>
                        {/* Badge removed; card highlight indicates selection */}
                      </div>
                      <div className={`${fontClass(value)} select-none`}>
                        <div className="text-xl font-semibold">The quick brown fox</div>
                        <div className="text-sm text-gray-600">Sphinx of black quartz, judge my vow.</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Removed separate selected preview; Combined Preview is below */}
          </div>
        </div>

        

        {/* Combined Preview */}
        <div className="mt-6 p-4 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Combined Preview</h4>
          <div 
            className={`p-6 rounded-lg shadow-sm ${fontClass(fontFamily)}`}
            style={{ backgroundColor }}
          >
            <h3 
              className="text-2xl font-bold mb-2"
              style={{ color: secondaryColor }}
            >
              Your Business Name
            </h3>
            <p 
              className="text-sm mb-4"
              style={{ color: secondaryColor, opacity: 0.7 }}
            >
              {tagline || 'Experience our services with your custom theme'}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button 
                className={`px-6 py-2 font-medium ${
                  buttonStyle === 'soft' ? 'rounded-lg shadow-md' :
                  buttonStyle === 'rounded' ? 'rounded-lg' :
                  buttonStyle === 'square' ? '' :
                  buttonStyle === 'pill' ? 'rounded-full' :
                  
                  buttonStyle === 'soft-rounded' ? 'rounded-2xl' :
                  buttonStyle === 'outlined' ? 'rounded-lg border-2' :
                  buttonStyle === 'outline-dashed' ? 'rounded-lg border-2 border-dashed' :
                  buttonStyle === 'ghost' ? 'rounded-lg border-2 border-transparent' :
                  buttonStyle === 'link' ? 'rounded-none underline shadow-none' :
                  buttonStyle === 'shadow' ? 'rounded-lg shadow-lg' :
                  buttonStyle === '3d' ? 'rounded-lg' :
                  'rounded-lg'
                }`}
                style={{
                  background: (['outlined','outline-dashed','ghost','link'].includes(buttonStyle))
                    ? 'transparent'
                    : ((useGradientButtons || buttonStyle === 'gradient')
                        ? `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)`
                        : primaryColor),
                  color: (['outlined','outline-dashed','ghost','link'].includes(buttonStyle)) ? primaryColor : '#FFFFFF',
                  borderColor: (['outlined','outline-dashed'].includes(buttonStyle)) ? primaryColor : undefined
                }}
              >
                Book Now
              </button>
              <button 
                className={`px-6 py-2 border-2 font-medium ${
                  buttonStyle === 'soft' ? 'rounded-lg shadow-md' :
                  buttonStyle === 'rounded' ? 'rounded-lg' :
                  buttonStyle === 'square' ? '' :
                  buttonStyle === 'pill' ? 'rounded-full' :
                  
                  buttonStyle === 'soft-rounded' ? 'rounded-2xl' :
                  buttonStyle === 'outlined' ? 'rounded-lg' :
                  buttonStyle === 'shadow' ? 'rounded-lg shadow-md' :
                  buttonStyle === '3d' ? 'rounded-lg' :
                  'rounded-lg'
                }`}
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Slug
              </label>
              <input
                type="text"
                value={business.slug}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">
                This is used in your landing page URL and cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={business.description || ''}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                placeholder="Add a description in Business Information"
              />
              <p className="text-sm text-gray-500 mt-1">
                Update this in the Business Information section
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || slugStatus==='checking' || slugStatus==='taken' || !!slugError || domainStatus==='invalid'}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {isSaving
              ? 'Saving...'
              : (slugStatus==='taken' || slugError || domainStatus==='invalid'
                ? 'Fix errors to save'
                : 'Save Settings')}
          </button>
        </div>
      </div>
    </div>
  )
}
