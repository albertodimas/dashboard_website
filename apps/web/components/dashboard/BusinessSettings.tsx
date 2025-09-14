'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { Globe, Save, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react'

interface BusinessSettingsProps {
  business: any
  onUpdate: (data: any) => void
}

export default function BusinessSettings({ business, onUpdate }: BusinessSettingsProps) {
  const toast = useToast()
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
  // Unified presets used for rendering and detection
  const PRESETS: Array<{ name: string; p: string; s: string; a: string; b: string }> = [
    // Core presets
    { name: 'Modern Blue',    p: '#3B82F6', s: '#1F2937', a: '#10B981', b: '#FFFFFF' },
    { name: 'Elegant Purple', p: '#8B5CF6', s: '#374151', a: '#F59E0B', b: '#F9FAFB' },
    { name: 'Fresh Green',    p: '#059669', s: '#111827', a: '#F97316', b: '#F0FDF4' },
    { name: 'Warm Orange',    p: '#EA580C', s: '#1F2937', a: '#0891B2', b: '#FFF7ED' },
    { name: 'Classic Dark',   p: '#6B7280', s: '#111827', a: '#EF4444', b: '#F9FAFB' },
    { name: 'Ocean Blue',     p: '#0891B2', s: '#0F172A', a: '#F59E0B', b: '#F0F9FF' },
    { name: 'Rose Pink',      p: '#EC4899', s: '#831843', a: '#14B8A6', b: '#FDF2F8' },
    { name: 'Sunset Red',     p: '#DC2626', s: '#7F1D1D', a: '#FBBF24', b: '#FEF2F2' },
    { name: 'Mint Fresh',     p: '#14B8A6', s: '#134E4A', a: '#F472B6', b: '#F0FDFA' },
    // Additional presets
    { name: 'Sand Dune',      p: '#FCD34D', s: '#78716C', a: '#A78BFA', b: '#FEFCE8' },
    { name: 'Royal Purple',   p: '#7C3AED', s: '#1F2937', a: '#F59E0B', b: '#F5F3FF' },
    { name: 'Forest Green',   p: '#22C55E', s: '#064E3B', a: '#F59E0B', b: '#ECFDF5' },
    { name: 'Teal Navy',      p: '#0EA5E9', s: '#0F172A', a: '#14B8A6', b: '#E0F2FE' },
    // New dark presets
    { name: 'Dark Elegant',   p: '#6366F1', s: '#0F172A', a: '#F59E0B', b: '#0B1220' },
    { name: 'Forest Night',   p: '#22C55E', s: '#14532D', a: '#86EFAC', b: '#0B1220' },
    { name: 'Neon Pulse',     p: '#06B6D4', s: '#0B1120', a: '#F43F5E', b: '#0B1120' },
  ]
  const selectedPresetName = (PRESETS.find(x => eq(primaryColor,x.p) && eq(secondaryColor,x.s) && eq(accentColor,x.a) && eq(backgroundColor,x.b))?.name) || 'Custom'
  
  // Typography and button style states
  const [fontFamily, setFontFamily] = useState(currentTheme.fontFamily || 'inter')
  const [buttonStyle, setButtonStyle] = useState(currentTheme.buttonStyle || 'rounded')

  // UI layout options
  const currentUi = business.settings?.ui || {}
  const [chipsSticky, setChipsSticky] = useState(currentUi.chipsSticky !== false)
  const [paginationStyle, setPaginationStyle] = useState(currentUi.paginationStyle || 'numbered')
  const [heroOverlay, setHeroOverlay] = useState(currentUi.heroOverlay || 'strong')
  const [cardRadius, setCardRadius] = useState(currentUi.cardRadius || 'xl')
  const [shadowStyle, setShadowStyle] = useState(currentUi.shadowStyle || 'soft')
  const [typographyScale, setTypographyScale] = useState(currentUi.typographyScale || 'M')
  const [bodyScale, setBodyScale] = useState(currentUi.bodyScale || 'M')
  const [useGradientButtons, setUseGradientButtons] = useState(currentUi.useGradientButtons !== false)
  const [showMobileStickyCTA, setShowMobileStickyCTA] = useState(currentUi.showMobileStickyCTA !== false)
  const [showDesktopFloatingDirection, setShowDesktopFloatingDirection] = useState(currentUi.showDesktopFloatingDirection !== false)

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
          cardRadius,
          shadowStyle,
          typographyScale,
          bodyScale,
          useGradientButtons,
          showMobileStickyCTA,
          showDesktopFloatingDirection
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
            cardRadius,
            shadowStyle,
            typographyScale,
            bodyScale,
            useGradientButtons,
            showMobileStickyCTA,
            showDesktopFloatingDirection
          }
        })
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
        <h2 className="text-2xl font-bold">Website Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Custom URL Path */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom URL Path (Optional)
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
            Your Current Landing Page URL
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
            <div className="text-xs text-gray-500 mb-3">Selected: <span className="font-medium">{selectedPresetName}</span></div>
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
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: a }}></div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
              <select
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              >
                <option value="inter">Inter</option>
                <option value="poppins">Poppins</option>
                <option value="lato">Lato</option>
                <option value="opensans">Open Sans</option>
                <option value="raleway">Raleway</option>
                <option value="nunito">Nunito</option>
                <option value="merriweather">Merriweather</option>
                <option value="sourcesans">Source Sans Pro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Button Style Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🔘 Button Styles</h3>
          <p className="text-sm text-gray-600 mb-6">
            Choose how your buttons will appear across your site
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                buttonStyle === 'rounded' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setButtonStyle('rounded')}
            >
              <button 
                className="w-full px-4 py-2 rounded-lg text-white font-medium mb-2"
                style={{ backgroundColor: primaryColor }}
              >
                Rounded
              </button>
              <p className="text-xs text-gray-500 text-center">Soft & friendly</p>
            </div>
          </div>
          
          {/* Combined Preview */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Combined Preview</h4>
            <div 
              className={`p-6 rounded-lg shadow-sm ${
                fontFamily === 'inter' ? 'font-["Inter"]' :
                fontFamily === 'poppins' ? 'font-["Poppins"]' :
                fontFamily === 'lato' ? 'font-["Lato"]' :
                fontFamily === 'opensans' ? 'font-["Open_Sans"]' :
                fontFamily === 'raleway' ? 'font-["Raleway"]' :
                fontFamily === 'nunito' ? 'font-["Nunito"]' :
                fontFamily === 'merriweather' ? 'font-["Merriweather"]' :
                fontFamily === 'sourcesans' ? 'font-["Source_Sans_Pro"]' :
                'font-["Inter"]'
              }`}
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
                Experience our services with your custom theme
              </p>
              <div className="flex gap-2 flex-wrap">
                <button 
                  className={`px-6 py-2 text-white font-medium ${
                    buttonStyle === 'rounded' ? 'rounded-lg' :
                    buttonStyle === 'square' ? '' :
                    buttonStyle === 'pill' ? 'rounded-full' :
                    buttonStyle === 'soft-rounded' ? 'rounded-2xl' :
                    buttonStyle === 'outlined' ? 'rounded-lg border-2' :
                    buttonStyle === 'shadow' ? 'rounded-lg shadow-lg' :
                    buttonStyle === '3d' ? 'rounded-lg' :
                    'rounded-lg'
                  }`}
                  style={{ backgroundColor: primaryColor }}
                >
                  Book Now
                </button>
                <button 
                  className={`px-6 py-2 border-2 font-medium ${
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
            {isSaving ? 'Saving...' : (slugStatus==='taken' || slugError || domainStatus==='invalid' ? 'Fix errors to save' : 'Save Settings')}
          </button>
        </div>
      </div>
    </div>
  )
}

