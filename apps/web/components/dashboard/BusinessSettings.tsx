'use client'

import { useState } from 'react'
import { Globe, Save, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react'

interface BusinessSettingsProps {
  business: any
  onUpdate: (data: any) => void
}

export default function BusinessSettings({ business, onUpdate }: BusinessSettingsProps) {
  const [websiteUrl, setWebsiteUrl] = useState(business.websiteUrl || '')
  const [customSlug, setCustomSlug] = useState(business.customSlug || '')
  const [customDomain, setCustomDomain] = useState(business.customDomain || '')
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [slugError, setSlugError] = useState('')
  
  // Color theme states
  const currentTheme = business.settings?.theme || {}
  const [primaryColor, setPrimaryColor] = useState(currentTheme.primaryColor || '#3B82F6')
  const [secondaryColor, setSecondaryColor] = useState(currentTheme.secondaryColor || '#1F2937')
  const [accentColor, setAccentColor] = useState(currentTheme.accentColor || '#10B981')
  const [backgroundColor, setBackgroundColor] = useState(currentTheme.backgroundColor || '#FFFFFF')

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
    const reserved = ['api', 'admin', 'dashboard', 'login', 'register', 'business', '_next', 'public', 'assets']
    const firstSegment = cleaned.split('/')[0]
    
    if (reserved.includes(firstSegment.toLowerCase())) {
      setSlugError(`Cannot use reserved path: ${firstSegment}`)
      return false
    }
    
    // Check for valid characters (letters, numbers, hyphens, slashes)
    if (!/^[a-zA-Z0-9\-\/]+$/.test(cleaned)) {
      setSlugError('Only letters, numbers, hyphens and slashes allowed')
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
          backgroundColor
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
            backgroundColor
          }
        })
        setCustomSlug(data.customSlug || '')
        alert('✅ Settings saved successfully!')
      } else {
        console.error('Server error:', data)
        if (data.message?.includes('Unique constraint') || data.error?.includes('already taken')) {
          setSlugError('This URL is already taken by another business')
        } else {
          setSlugError(data.error || data.message || 'Failed to save settings')
          alert(`❌ Error: ${data.error || data.message || 'Failed to save settings'}`)
        }
      }
    } catch (error) {
      console.error('Network error saving settings:', error)
      setSlugError('Network error occurred')
      alert('❌ Network error occurred')
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
                validateSlug(e.target.value)
              }}
              placeholder="e.g., wmc/inicio or my-business"
              className={`flex-1 p-3 border rounded-lg ${
                slugError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {slugError && (
            <div className="flex items-center gap-1 text-red-600 text-sm mb-2">
              <AlertCircle size={16} />
              <span>{slugError}</span>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Create a custom URL for your business page (e.g., yoursite.com/wmc/inicio)
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
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="e.g., mybusiness.com"
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Configure a custom domain for your landing page (requires DNS configuration)
          </p>
        </div>

        {/* Theme Customization */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🎨 Theme Customization</h3>
          <p className="text-sm text-gray-600 mb-6">
            Customize the colors of your business landing page to match your brand
          </p>

          {/* Theme Presets */}
          <div className="mb-8">
            <h4 className="text-md font-semibold mb-4">🎯 Quick Theme Presets</h4>
            <p className="text-sm text-gray-600 mb-4">
              Choose from our professionally designed color combinations
            </p>
            
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
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}