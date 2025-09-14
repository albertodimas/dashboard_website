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
  const presetDetect: Array<{ name: string; p: string; s: string; a: string; b: string }> = [
    { name: 'Modern Blue', p: '#3B82F6', s: '#1F2937', a: '#10B981', b: '#FFFFFF' },
    { name: 'Elegant Purple', p: '#8B5CF6', s: '#374151', a: '#F59E0B', b: '#F9FAFB' },
    { name: 'Fresh Green', p: '#059669', s: '#111827', a: '#F97316', b: '#F0FDF4' },
    { name: 'Warm Orange', p: '#EA580C', s: '#1F2937', a: '#0891B2', b: '#FFF7ED' },
    { name: 'Classic Dark', p: '#6B7280', s: '#111827', a: '#EF4444', b: '#F9FAFB' },
    { name: 'Ocean Blue', p: '#0891B2', s: '#0F172A', a: '#F59E0B', b: '#F0F9FF' },
    { name: 'Rose Pink', p: '#EC4899', s: '#831843', a: '#14B8A6', b: '#FDF2F8' },
    { name: 'Sunset Red', p: '#DC2626', s: '#7F1D1D', a: '#FBBF24', b: '#FEF2F2' },
    { name: 'Mint Fresh', p: '#14B8A6', s: '#134E4A', a: '#F472B6', b: '#F0FDFA' },
  ]
  const selectedPresetName = (presetDetect.find(x => eq(primaryColor,x.p) && eq(secondaryColor,x.s) && eq(accentColor,x.a) && eq(backgroundColor,x.b))?.name) || 'Custom'
  
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
  const [showMobileStickyCTA, setShowMobileStickyCTA] = useState(currentUi.showMobileStickyCTA !== false)
  const [showDesktopFloatingDirection, setShowDesktopFloatingDirection] = useState(currentUi.showDesktopFloatingDirection !== false)

  const publicUrl = business.customSlug 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${business.customSlug}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/business/${business.slug}`
  
  const previewUrl = customSlug 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${customSlug}`
    : publicUrl

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
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
              {/* Modern Blue Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition"
                onClick={() => {
                  setPrimaryColor('#3B82F6')
                  setSecondaryColor('#1F2937')
                  setAccentColor('#10B981')
                  setBackgroundColor('#FFFFFF')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Modern Blue</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#1F2937' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Professional & trustworthy</div>
              </div>

              {/* Elegant Purple Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 transition"
                onClick={() => {
                  setPrimaryColor('#8B5CF6')
                  setSecondaryColor('#374151')
                  setAccentColor('#F59E0B')
                  setBackgroundColor('#F9FAFB')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Elegant Purple</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#8B5CF6' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#374151' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Creative & sophisticated</div>
              </div>

              {/* Fresh Green Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition"
                onClick={() => {
                  setPrimaryColor('#059669')
                  setSecondaryColor('#111827')
                  setAccentColor('#F97316')
                  setBackgroundColor('#F0FDF4')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Fresh Green</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#059669' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#111827' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Natural & vibrant</div>
              </div>

              {/* Warm Orange Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 transition"
                onClick={() => {
                  setPrimaryColor('#EA580C')
                  setSecondaryColor('#1F2937')
                  setAccentColor('#0891B2')
                  setBackgroundColor('#FFF7ED')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Warm Orange</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#EA580C' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#1F2937' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0891B2' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Energetic & friendly</div>
              </div>

              {/* Classic Dark Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-400 transition"
                onClick={() => {
                  setPrimaryColor('#6B7280')
                  setSecondaryColor('#111827')
                  setAccentColor('#EF4444')
                  setBackgroundColor('#F9FAFB')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Classic Dark</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#6B7280' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#111827' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#EF4444' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Minimalist & elegant</div>
              </div>

              {/* Ocean Blue Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-cyan-300 transition"
                onClick={() => {
                  setPrimaryColor('#0891B2')
                  setSecondaryColor('#0F172A')
                  setAccentColor('#F59E0B')
                  setBackgroundColor('#F0F9FF')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Ocean Blue</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0891B2' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0F172A' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Calm & trustworthy</div>
              </div>

              {/* Rose Pink Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-pink-300 transition"
                onClick={() => {
                  setPrimaryColor('#EC4899')
                  setSecondaryColor('#831843')
                  setAccentColor('#14B8A6')
                  setBackgroundColor('#FDF2F8')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Rose Pink</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#EC4899' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#831843' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#14B8A6' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Soft & feminine</div>
              </div>

              {/* Sunset Red Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-red-300 transition"
                onClick={() => {
                  setPrimaryColor('#DC2626')
                  setSecondaryColor('#7F1D1D')
                  setAccentColor('#FBBF24')
                  setBackgroundColor('#FEF2F2')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Sunset Red</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#DC2626' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#7F1D1D' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FBBF24' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Bold & passionate</div>
              </div>

              {/* Mint Fresh Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-teal-300 transition"
                onClick={() => {
                  setPrimaryColor('#14B8A6')
                  setSecondaryColor('#134E4A')
                  setAccentColor('#F472B6')
                  setBackgroundColor('#F0FDFA')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Mint Fresh</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#14B8A6' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#134E4A' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F472B6' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Clean & refreshing</div>
              </div>

              {/* Golden Hour Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-yellow-300 transition"
                onClick={() => {
                  setPrimaryColor('#F59E0B')
                  setSecondaryColor('#78350F')
                  setAccentColor('#7C3AED')
                  setBackgroundColor('#FFFBEB')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Golden Hour</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#78350F' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#7C3AED' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Warm & luxurious</div>
              </div>

              {/* Midnight Blue Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition"
                onClick={() => {
                  setPrimaryColor('#4F46E5')
                  setSecondaryColor('#1E1B4B')
                  setAccentColor('#06B6D4')
                  setBackgroundColor('#EEF2FF')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Midnight Blue</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#4F46E5' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#1E1B4B' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#06B6D4' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Deep & mysterious</div>
              </div>

              {/* Sky Blue Light Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-sky-300 transition"
                onClick={() => {
                  setPrimaryColor('#60A5FA')
                  setSecondaryColor('#475569')
                  setAccentColor('#34D399')
                  setBackgroundColor('#F0F9FF')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Sky Blue Light</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#60A5FA' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#475569' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#34D399' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Light & airy</div>
              </div>

              {/* Soft Lavender Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 transition"
                onClick={() => {
                  setPrimaryColor('#C084FC')
                  setSecondaryColor('#6B7280')
                  setAccentColor('#FDA4AF')
                  setBackgroundColor('#FAF5FF')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Soft Lavender</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#C084FC' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#6B7280' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FDA4AF' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Gentle & soothing</div>
              </div>

              {/* Peach Blossom Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 transition"
                onClick={() => {
                  setPrimaryColor('#FDBA74')
                  setSecondaryColor('#64748B')
                  setAccentColor('#93C5FD')
                  setBackgroundColor('#FFF7ED')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Peach Blossom</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FDBA74' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#64748B' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#93C5FD' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Soft & warm</div>
              </div>

              {/* Mint Cream Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition"
                onClick={() => {
                  setPrimaryColor('#86EFAC')
                  setSecondaryColor('#57534E')
                  setAccentColor('#FCA5A5')
                  setBackgroundColor('#F0FDF4')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Mint Cream</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#86EFAC' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#57534E' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FCA5A5' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Fresh & light</div>
              </div>

              {/* Coral Reef Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-pink-300 transition"
                onClick={() => {
                  setPrimaryColor('#FB7185')
                  setSecondaryColor('#525252')
                  setAccentColor('#67E8F9')
                  setBackgroundColor('#FFF1F2')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Coral Reef</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FB7185' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#525252' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#67E8F9' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Vibrant & tropical</div>
              </div>

              {/* Sand Dune Theme */}
              <div 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-yellow-300 transition"
                onClick={() => {
                  setPrimaryColor('#FCD34D')
                  setSecondaryColor('#78716C')
                  setAccentColor('#A78BFA')
                  setBackgroundColor('#FEFCE8')
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Sand Dune</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FCD34D' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#78716C' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#A78BFA' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Desert & calm</div>
              </div>

              {/* Royal Purple */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition ${eq(primaryColor,'#7C3AED')&&eq(secondaryColor,'#1F2937')&&eq(accentColor,'#F59E0B')&&eq(backgroundColor,'#F5F3FF') ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400' : 'border-gray-200 hover:border-purple-300'}`}
                onClick={() => { setPrimaryColor('#7C3AED'); setSecondaryColor('#1F2937'); setAccentColor('#F59E0B'); setBackgroundColor('#F5F3FF') }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Royal Purple</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#7C3AED' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#1F2937' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Premium & bold</div>
              </div>

              {/* Forest Green */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition ${eq(primaryColor,'#22C55E')&&eq(secondaryColor,'#064E3B')&&eq(accentColor,'#F59E0B')&&eq(backgroundColor,'#ECFDF5') ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400' : 'border-gray-200 hover:border-green-300'}`}
                onClick={() => { setPrimaryColor('#22C55E'); setSecondaryColor('#064E3B'); setAccentColor('#F59E0B'); setBackgroundColor('#ECFDF5') }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Forest Green</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22C55E' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#064E3B' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Natural & calm</div>
              </div>

              {/* Teal Navy */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition ${eq(primaryColor,'#0EA5E9')&&eq(secondaryColor,'#0F172A')&&eq(accentColor,'#14B8A6')&&eq(backgroundColor,'#E0F2FE') ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400' : 'border-gray-200 hover:border-sky-300'}`}
                onClick={() => { setPrimaryColor('#0EA5E9'); setSecondaryColor('#0F172A'); setAccentColor('#14B8A6'); setBackgroundColor('#E0F2FE') }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Teal Navy</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0EA5E9' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0F172A' }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#14B8A6' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Cool & modern</div>
              </div>
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
              <button 
                className="px-4 py-2 rounded-md text-white font-medium mr-2"
                style={{ backgroundColor: primaryColor }}
              >
                Primary Button
              </button>
              <button 
                className="px-4 py-2 rounded-md text-white font-medium"
                style={{ backgroundColor: accentColor }}
              >
                Accent Button
              </button>
            </div>
          </div>
        </div>

        {/* UI Layout Options */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🧩 UI Options</h3>
          <p className="text-sm text-gray-600 mb-6">Tweak layout and interactions in your public site.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter Chips Behavior</label>
              <div className="flex items-center gap-3">
                <input id="chipsSticky" type="checkbox" checked={chipsSticky} onChange={(e)=>setChipsSticky(e.target.checked)} />
                <label htmlFor="chipsSticky" className="text-sm text-gray-700">Sticky on scroll (recommended)</label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Keeps category filters visible while scrolling.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pagination Style</label>
              <select value={paginationStyle} onChange={(e)=>setPaginationStyle(e.target.value)} className="w-full p-3 border rounded-lg">
                <option value="numbered">Numbered (1, 2, 3)</option>
                <option value="simple">Simple (Prev/Next)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Overlay</label>
              <select value={heroOverlay} onChange={(e)=>setHeroOverlay(e.target.value)} className="w-full p-3 border rounded-lg">
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Radius</label>
              <select value={cardRadius} onChange={(e)=>setCardRadius(e.target.value)} className="w-full p-3 border rounded-lg">
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shadow Style</label>
              <select value={shadowStyle} onChange={(e)=>setShadowStyle(e.target.value)} className="w-full p-3 border rounded-lg">
                <option value="soft">Soft</option>
                <option value="md">Medium</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Sticky CTA</label>
              <div className="flex items-center gap-3">
                <input id="mobileStickyCta" type="checkbox" checked={showMobileStickyCTA} onChange={(e)=>setShowMobileStickyCTA(e.target.checked)} />
                <label htmlFor="mobileStickyCta" className="text-sm text-gray-700">Show a bottom bar with Reserve / Call on mobile</label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Improves conversion by exposing main actions persistently on small screens.</p>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Desktop Floating "How to get there"</label>
              <div className="flex items-center gap-3">
                <input id="desktopFloatingDir" type="checkbox" checked={showDesktopFloatingDirection} onChange={(e)=>setShowDesktopFloatingDirection(e.target.checked)} />
                <label htmlFor="desktopFloatingDir" className="text-sm text-gray-700">Show floating Google Maps button on desktop</label>
              </div>
            </div>
          </div>
        </div>

        {/* Typography Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">📝 Typography</h3>
          <p className="text-sm text-gray-600 mb-6">
            Choose a font family that represents your brand personality
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Inter - Modern & Clean */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                fontFamily === 'inter' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFontFamily('inter')}
            >
              <div className="font-['Inter'] mb-2">
                <h4 className="text-lg font-bold">Inter</h4>
                <p className="text-sm">The quick brown fox jumps</p>
              </div>
              <p className="text-xs text-gray-500">Modern & clean</p>
            </div>

            {/* Playfair Display - Elegant */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                fontFamily === 'playfair' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFontFamily('playfair')}
            >
              <div className="font-['Playfair_Display'] mb-2">
                <h4 className="text-lg font-bold">Playfair Display</h4>
                <p className="text-sm">The quick brown fox jumps</p>
              </div>
              <p className="text-xs text-gray-500">Elegant & sophisticated</p>
            </div>

            {/* Montserrat - Professional */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                fontFamily === 'montserrat' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFontFamily('montserrat')}
            >
              <div className="font-['Montserrat'] mb-2">
                <h4 className="text-lg font-bold">Montserrat</h4>
                <p className="text-sm">The quick brown fox jumps</p>
              </div>
              <p className="text-xs text-gray-500">Professional & bold</p>
            </div>

            {/* Roboto - Friendly */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                fontFamily === 'roboto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFontFamily('roboto')}
            >
              <div className="font-['Roboto'] mb-2">
                <h4 className="text-lg font-bold">Roboto</h4>
                <p className="text-sm">The quick brown fox jumps</p>
              </div>
              <p className="text-xs text-gray-500">Friendly & approachable</p>
            </div>

            {/* Poppins - Geometric */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                fontFamily === 'poppins' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFontFamily('poppins')}
            >
              <div className="font-['Poppins'] mb-2">
                <h4 className="text-lg font-bold">Poppins</h4>
                <p className="text-sm">The quick brown fox jumps</p>
              </div>
              <p className="text-xs text-gray-500">Geometric & modern</p>
            </div>

            {/* Lato - Humanist */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                fontFamily === 'lato' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFontFamily('lato')}
            >
              <div className="font-['Lato'] mb-2">
                <h4 className="text-lg font-bold">Lato</h4>
                <p className="text-sm">The quick brown fox jumps</p>
              </div>
              <p className="text-xs text-gray-500">Humanist & warm</p>
            </div>

            {/* Open Sans - Universal */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                fontFamily === 'opensans' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFontFamily('opensans')}
            >
              <div className="font-['Open_Sans'] mb-2">
                <h4 className="text-lg font-bold">Open Sans</h4>
                <p className="text-sm">The quick brown fox jumps</p>
              </div>
              <p className="text-xs text-gray-500">Universal & readable</p>
            </div>

            {/* Raleway - Elegant Sans */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                fontFamily === 'raleway' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFontFamily('raleway')}
            >
              <div className="font-['Raleway'] mb-2">
                <h4 className="text-lg font-bold">Raleway</h4>
                <p className="text-sm">The quick brown fox jumps</p>
              </div>
              <p className="text-xs text-gray-500">Elegant sans-serif</p>
            </div>

            {/* Nunito - Rounded */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                fontFamily === 'nunito' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFontFamily('nunito')}
            >
              <div className="font-['Nunito'] mb-2">
                <h4 className="text-lg font-bold">Nunito</h4>
                <p className="text-sm">The quick brown fox jumps</p>
              </div>
              <p className="text-xs text-gray-500">Rounded & friendly</p>
            </div>

            {/* Merriweather - Serif */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                fontFamily === 'merriweather' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFontFamily('merriweather')}
            >
              <div className="font-['Merriweather'] mb-2">
                <h4 className="text-lg font-bold">Merriweather</h4>
                <p className="text-sm">The quick brown fox jumps</p>
              </div>
              <p className="text-xs text-gray-500">Traditional serif</p>
            </div>

            {/* Source Sans Pro - Clean */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                fontFamily === 'sourcesans' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFontFamily('sourcesans')}
            >
              <div className="font-['Source_Sans_Pro'] mb-2">
                <h4 className="text-lg font-bold">Source Sans Pro</h4>
                <p className="text-sm">The quick brown fox jumps</p>
              </div>
              <p className="text-xs text-gray-500">Clean & minimal</p>
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
            {/* Rounded */}
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

            {/* Square */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                buttonStyle === 'square' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setButtonStyle('square')}
            >
              <button 
                className="w-full px-4 py-2 text-white font-medium mb-2"
                style={{ backgroundColor: primaryColor }}
              >
                Square
              </button>
              <p className="text-xs text-gray-500 text-center">Sharp & modern</p>
            </div>

            {/* Pill */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                buttonStyle === 'pill' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setButtonStyle('pill')}
            >
              <button 
                className="w-full px-4 py-2 rounded-full text-white font-medium mb-2"
                style={{ backgroundColor: primaryColor }}
              >
                Pill
              </button>
              <p className="text-xs text-gray-500 text-center">Smooth & playful</p>
            </div>

            {/* Gradient */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                buttonStyle === 'gradient' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setButtonStyle('gradient')}
            >
              <button 
                className="w-full px-4 py-2 rounded-lg text-white font-medium mb-2"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` 
                }}
              >
                Gradient
              </button>
              <p className="text-xs text-gray-500 text-center">Dynamic & eye-catching</p>
            </div>

            {/* Soft Rounded */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                buttonStyle === 'soft-rounded' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setButtonStyle('soft-rounded')}
            >
              <button 
                className="w-full px-4 py-2 rounded-2xl text-white font-medium mb-2"
                style={{ backgroundColor: primaryColor }}
              >
                Soft Rounded
              </button>
              <p className="text-xs text-gray-500 text-center">Extra smooth</p>
            </div>

            {/* Outlined */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                buttonStyle === 'outlined' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setButtonStyle('outlined')}
            >
              <button 
                className="w-full px-4 py-2 rounded-lg font-medium mb-2 border-2"
                style={{ 
                  borderColor: primaryColor,
                  color: primaryColor,
                  backgroundColor: 'transparent'
                }}
              >
                Outlined
              </button>
              <p className="text-xs text-gray-500 text-center">Minimal & clean</p>
            </div>

            {/* Shadow */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                buttonStyle === 'shadow' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setButtonStyle('shadow')}
            >
              <button 
                className="w-full px-4 py-2 rounded-lg text-white font-medium mb-2 shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                Shadow
              </button>
              <p className="text-xs text-gray-500 text-center">Elevated & bold</p>
            </div>

            {/* 3D Effect */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                buttonStyle === '3d' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setButtonStyle('3d')}
            >
              <button 
                className="w-full px-4 py-2 rounded-lg text-white font-medium mb-2"
                style={{ 
                  backgroundColor: primaryColor,
                  boxShadow: `0 4px 0 ${primaryColor}80`,
                  transform: 'translateY(-2px)'
                }}
              >
                3D Effect
              </button>
              <p className="text-xs text-gray-500 text-center">Depth & dimension</p>
            </div>
          </div>

          {/* Combined Preview */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Full Preview</h4>
            <div 
              className={`p-6 rounded-lg shadow-sm ${
                fontFamily === 'inter' ? 'font-["Inter"]' :
                fontFamily === 'playfair' ? 'font-["Playfair_Display"]' :
                fontFamily === 'montserrat' ? 'font-["Montserrat"]' :
                fontFamily === 'roboto' ? 'font-["Roboto"]' :
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
                  style={{ 
                    ...(buttonStyle === 'gradient' ? {
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`
                    } : buttonStyle === 'outlined' ? {
                      backgroundColor: 'transparent',
                      borderColor: primaryColor,
                      color: primaryColor
                    } : buttonStyle === '3d' ? {
                      backgroundColor: primaryColor,
                      boxShadow: `0 4px 0 ${primaryColor}80`,
                      transform: 'translateY(-2px)'
                    } : {
                      backgroundColor: primaryColor
                    })
                  }}
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
                  style={{ 
                    borderColor: primaryColor,
                    color: primaryColor,
                    ...(buttonStyle === '3d' ? {
                      boxShadow: `0 3px 0 ${primaryColor}40`,
                      transform: 'translateY(-1px)'
                    } : {})
                  }}
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
