'use client'

import { logger } from '@/lib/logger'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'
import DashboardNav from '@/components/DashboardNav'
import OperationModeSelector from '@/components/OperationModeSelector'
import BusinessSettings from '@/components/dashboard/BusinessSettings'
import { BusinessTypeSelector } from '@/components/business-type-selector'
import { BusinessType } from '@/lib/business-types'
import { countries, cities, type CountryState } from '@/lib/countries'
import { Camera, User } from 'lucide-react'
import { compressImage, formatFileSize } from '@/lib/image-resize-client'

type OperationMode = 'RESERVA' | 'PROYECTO'

interface UserProfileState {
  name: string
  lastName: string
  email: string
  phone: string
  language: string
  avatar: string
}

interface BusinessInfoState {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  website: string
  description: string
  businessType: string
  businessCategory: string
  logo: string
  coverImage: string
}

interface NotificationSettingsState {
  emailNotifications: boolean
  smsNotifications: boolean
  appointmentReminders: boolean
}

interface ScheduleSettingsState {
  timeInterval: number
  startTime: string
  endTime: string
  workingDays: number[]
}

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

interface BusinessSettingsEnvelope {
  theme?: BusinessThemeSettings | null
  ui?: BusinessUiSettings | null
  notifications?: Partial<NotificationSettingsState> | null
  scheduleSettings?: Partial<ScheduleSettingsState> | null
  operationMode?: OperationMode | string | null
}

interface BusinessSettingsResponse extends BusinessInfoState {
  id?: string
  slug: string
  websiteUrl?: string
  customSlug?: string | null
  customDomain?: string | null
  settings?: BusinessSettingsEnvelope | null
}

interface AuthResponse {
  user: {
    name?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
    language?: string | null
    avatar?: string | null
  }
}

const defaultUserProfile: UserProfileState = {
  name: '',
  lastName: '',
  email: '',
  phone: '',
  language: 'en',
  avatar: ''
}

const defaultBusinessInfo: BusinessInfoState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  website: '',
  description: '',
  businessType: BusinessType.OTHER,
  businessCategory: '',
  logo: '',
  coverImage: ''
}

const defaultBusinessData: BusinessSettingsResponse = {
  ...defaultBusinessInfo,
  slug: '',
  websiteUrl: undefined,
  customSlug: null,
  customDomain: null,
  settings: null,
}

const defaultNotifications: NotificationSettingsState = {
  emailNotifications: true,
  smsNotifications: false,
  appointmentReminders: true
}

const defaultScheduleSettings: ScheduleSettingsState = {
  timeInterval: 30,
  startTime: '',
  endTime: '',
  workingDays: []
}

const normalizeBusiness = (data?: Partial<BusinessSettingsResponse>): BusinessSettingsResponse => {
  const merged = {
    ...defaultBusinessData,
    ...data,
    slug: data?.slug ?? defaultBusinessData.slug,
    websiteUrl: typeof data?.websiteUrl === 'string' ? data.websiteUrl : undefined,
    customSlug: data?.customSlug ?? null,
    customDomain: data?.customDomain ?? null,
    settings: data?.settings ?? null,
  }

  return {
    ...merged,
    name: merged.name ?? '',
    email: merged.email ?? '',
    phone: merged.phone ?? '',
    address: merged.address ?? '',
    city: merged.city ?? '',
    state: merged.state ?? '',
    postalCode: merged.postalCode ?? '',
    country: merged.country ?? '',
    website: merged.website ?? '',
    description: merged.description ?? '',
    businessType: merged.businessType ?? BusinessType.OTHER,
    businessCategory: merged.businessCategory ?? '',
    logo: merged.logo ?? '',
    coverImage: merged.coverImage ?? '',
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()
  const [userProfile, setUserProfile] = useState<UserProfileState>(() => ({ ...defaultUserProfile }))
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfoState>(() => ({ ...defaultBusinessInfo }))
  const [notifications, setNotifications] = useState<NotificationSettingsState>(() => ({ ...defaultNotifications }))
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettingsState>(() => ({ ...defaultScheduleSettings }))
  const [operationMode, setOperationMode] = useState<OperationMode>('RESERVA')
  const [businessData, setBusinessData] = useState<BusinessSettingsResponse | null>(null)
  const [availableStates, setAvailableStates] = useState<CountryState[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])

  const getCitiesForCountry = (countryCode: string) => cities[countryCode] ?? []

  // Handle country change
  const handleCountryChange = (countryCode: string) => {
    setBusinessInfo((prev) => ({ ...prev, country: countryCode, state: '', city: '' }))
    const country = countries.find(c => c.code === countryCode)
    setAvailableStates(country?.states ?? [])
    setAvailableCities(getCitiesForCountry(countryCode))
  }

  // Handle state change
  const handleStateChange = (stateCode: string) => {
    setBusinessInfo((prev) => ({ ...prev, state: stateCode, city: '' }))

    const currentCountryCode = businessInfo.country
    const country = countries.find(c => c.code === currentCountryCode)
    const state = country?.states.find(s => s.code === stateCode)

    if (state?.cities && Array.isArray(state.cities)) {
      setAvailableCities(state.cities)
    } else {
      // Fallback to general country cities if state doesn't have specific cities
      setAvailableCities(getCitiesForCountry(currentCountryCode))
    }
  }

  useEffect(() => {
    // Check authentication and load business info from API
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(async (authData: AuthResponse) => {
        // Set user profile from auth data
        const user = authData?.user ?? {}
        setUserProfile({
          ...defaultUserProfile,
          name: user.name ?? '',
          lastName: user.lastName ?? '',
          email: user.email ?? '',
          phone: user.phone ?? '',
          language: user.language ?? 'en',
          avatar: user.avatar ?? ''
        })
        
        try {
          const response = await fetch('/api/dashboard/business')
          if (response.ok) {
            const rawData = await response.json() as Partial<BusinessSettingsResponse>
            const normalizedBusiness = normalizeBusiness(rawData)
            setBusinessData(normalizedBusiness)
            setBusinessInfo({
              ...defaultBusinessInfo,
              name: normalizedBusiness.name,
              email: normalizedBusiness.email,
              phone: normalizedBusiness.phone,
              address: normalizedBusiness.address,
              city: normalizedBusiness.city,
              state: normalizedBusiness.state,
              postalCode: normalizedBusiness.postalCode,
              country: normalizedBusiness.country,
              website: normalizedBusiness.website,
              description: normalizedBusiness.description,
              businessType: normalizedBusiness.businessType,
              businessCategory: normalizedBusiness.businessCategory,
              logo: normalizedBusiness.logo,
              coverImage: normalizedBusiness.coverImage
            })

            // Set available states and cities based on current country and state
            if (normalizedBusiness.country) {
              const country = countries.find(c => c.code === normalizedBusiness.country)
              setAvailableStates(country?.states ?? [])
              
              // If there's also a state selected, load cities for that state
              if (normalizedBusiness.state && country) {
                const state = country.states.find(s => s.code === normalizedBusiness.state)
                if (state?.cities && Array.isArray(state.cities)) {
                  setAvailableCities(state.cities)
                } else {
                  setAvailableCities(getCitiesForCountry(normalizedBusiness.country))
                }
              } else {
                setAvailableCities(getCitiesForCountry(normalizedBusiness.country))
              }
            }
            
            // Load settings from the business settings field
            const settings = normalizedBusiness.settings ?? {}
            if (settings.notifications) {
              setNotifications({
                ...defaultNotifications,
                ...settings.notifications,
              })
            }
            if (settings.scheduleSettings) {
              const normalizedSchedule: ScheduleSettingsState = {
                ...defaultScheduleSettings,
                ...settings.scheduleSettings,
              }
              normalizedSchedule.workingDays = Array.isArray(settings.scheduleSettings.workingDays)
                ? settings.scheduleSettings.workingDays.filter((day): day is number => typeof day === 'number')
                : defaultScheduleSettings.workingDays
              setScheduleSettings(normalizedSchedule)
            }
            if (settings.operationMode) {
              setOperationMode(settings.operationMode === 'PROYECTO' ? 'PROYECTO' : 'RESERVA')
            }
          }
        } catch (error) {
          logger.error('Error loading business info:', error)
        }
        setLoading(false)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const handleBusinessLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast(t('pleaseSelectImageFile') || 'Please select an image file', 'info')
      return
    }
    
    setUploadingLogo(true)
    
    try {
      // Show original file size
      const originalSize = formatFileSize(file.size)
      logger.info(`Original logo size: ${originalSize}`)
      
      // Compress image if needed (max 5MB after compression)
      const compressedFile = await compressImage(file, 5)
      const compressedSize = formatFileSize(compressedFile.size)
      logger.info(`Compressed logo size: ${compressedSize}`)
      
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        setBusinessInfo(prev => ({ ...prev, logo: base64String }))
        setUploadingLogo(false)
        
        // Show success message with compression info if file was compressed
        if (file.size !== compressedFile.size) {
          const message = (t('logoUploadedCompressed') || 'Logo uploaded successfully! (Compressed from {a} to {b})')
            .replace('{a}', originalSize)
            .replace('{b}', compressedSize)
          logger.info(message)
        }
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      logger.error('Error uploading logo:', error)
      toast(t('failedToUploadImage') || 'Failed to upload image', 'error')
      setUploadingLogo(false)
    }
  }

  const handleSaveOperationMode = async () => {
    setSaving(true)
    try {
      const businessResponse = await fetch('/api/dashboard/business')
      const businessPayload = await businessResponse.json() as BusinessSettingsResponse
      const updatedSettings = {
        ...(businessPayload.settings ?? {}),
        operationMode
      }
      const response = await fetch('/api/dashboard/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings }),
      })
      if (!response.ok) throw new Error('Failed to save mode')
      toast(t('operationModeSaved') || 'Operation mode saved!', 'success')
    } catch (e) {
      logger.error('Error saving operation mode:', e)
      toast(t('failedToSaveOperationMode') || 'Failed to save operation mode', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast(t('pleaseSelectImageFile') || 'Please select an image file', 'info')
      return
    }
    
    setUploadingAvatar(true)
    
    try {
      // Show original file size
      const originalSize = formatFileSize(file.size)
      logger.info(`Original avatar size: ${originalSize}`)
      
      // Compress image if needed (max 5MB after compression)
      const compressedFile = await compressImage(file, 5)
      const compressedSize = formatFileSize(compressedFile.size)
      logger.info(`Compressed avatar size: ${compressedSize}`)
      
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        setUserProfile(prev => ({ ...prev, avatar: base64String }))
        setUploadingAvatar(false)
        
        // Show success message with compression info if file was compressed
        if (file.size !== compressedFile.size) {
          const message = (t('avatarUploadedCompressed') || 'Avatar uploaded successfully! (Compressed from {a} to {b})')
            .replace('{a}', originalSize)
            .replace('{b}', compressedSize)
          logger.info(message)
        }
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      logger.error('Error uploading avatar:', error)
      toast(t('failedToUploadImage') || 'Failed to upload image', 'error')
      setUploadingAvatar(false)
    }
  }

  const handleSaveUserProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      toast(t('profileSavedSuccessfully') || 'Profile saved successfully!', 'success')
    } catch (error) {
      logger.error('Error saving profile:', error)
      toast(t('failedToSaveProfile') || 'Failed to save profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/dashboard/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...businessInfo,
          logo: businessInfo.logo,
          coverImage: businessInfo.coverImage
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save business info')
      }
      
      const result = await response.json() as { business?: Partial<BusinessSettingsResponse> }
      
      // Update businessData with new values
      if (result.business) {
        const update = result.business
        setBusinessData((prev) => {
          const combined = {
            ...(prev ?? {}),
            ...update,
          } as Partial<BusinessSettingsResponse>
          return normalizeBusiness(combined)
        })
        
        // Show success message with new URL if name changed
        if (result.business.customSlug) {
          const publicUrl = `${window.location.origin}/${result.business.customSlug}`
          toast((t('businessInfoSavedWithUrl') || 'Business information saved! Your public page: {url}').replace('{url}', publicUrl), 'success')
        } else {
          toast(t('businessInfoSaved') || 'Business information saved!', 'success')
        }
      }
    } catch (error) {
      logger.error('Error saving business info:', error)
      toast(t('failedToSaveBusinessInfo') || 'Failed to save business information', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      // Get current business settings
      const businessResponse = await fetch('/api/dashboard/business')
      const businessPayload = await businessResponse.json() as BusinessSettingsResponse
      
      // Update settings with notifications
      const updatedSettings = {
        ...(businessPayload.settings ?? {}),
        notifications
      }
      
      // Save to database
      const response = await fetch('/api/dashboard/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: updatedSettings
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save notifications')
      }
      
      toast(t('notificationSettingsSaved') || 'Notification settings saved!', 'success')
    } catch (error) {
      logger.error('Error saving notifications:', error)
      toast(t('failedToSaveNotificationSettings') || 'Failed to save notification settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSchedule = async () => {
    setSaving(true)
    try {
      // Get current business settings
      const businessResponse = await fetch('/api/dashboard/business')
      const businessPayload = await businessResponse.json() as BusinessSettingsResponse
      
      // Update settings with schedule
      const updatedSettings = {
        ...(businessPayload.settings ?? {}),
        scheduleSettings
      }
      
      // Save to database
      const response = await fetch('/api/dashboard/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: updatedSettings
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save schedule')
      }
      
      toast(t('scheduleSettingsSaved') || 'Schedule settings saved!', 'success')
    } catch (error) {
      logger.error('Error saving schedule:', error)
      toast(t('failedToSaveScheduleSettings') || 'Failed to save schedule settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleWorkingDay = (day: number) => {
    setScheduleSettings((prev) => {
      const updatedDays = prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day].sort((a, b) => a - b)
      return { ...prev, workingDays: updatedDays }
    })
  }

  const handleClearData = async () => {
    const ok = await confirm({
      title: t('clearAllData') || 'Clear All Data',
      message: t('clearAllDataConfirmDetailed') || 'Are you sure? This will delete all your data (appointments, customers, services).',
      confirmText: t('clear') || 'Clear',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await fetch('/api/dashboard/clear-data', { method: 'POST' })
      toast(t('dataCleared') || 'All data has been cleared.', 'success')
      router.push('/dashboard')
    } catch (error) {
      logger.error('Error clearing data:', error)
      toast(t('failedToClearData') || 'Failed to clear data', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold">{t('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('settings')}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('manageAccountAndSettings') || 'Manage your account and application settings'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Operation Mode */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t('operationModeTitle') || 'Operation Mode'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">{t('operationModeDesc')}</p>
            <OperationModeSelector value={operationMode} onChange={setOperationMode as any} />
            <button
              onClick={handleSaveOperationMode}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save')}
            </button>
          </div>
          {/* Language preference managed from top-right selector. Block removed to avoid duplication. */}

          {/* User Profile */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('userProfileTitle') || 'User Profile'}
            </h2>
            <form onSubmit={handleSaveUserProfile} className="space-y-4">
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profilePhoto') || 'Profile Photo'}
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {userProfile.avatar ? (
                      <img
                        src={userProfile.avatar}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500">
                      {t('cameraUploadHint') || 'Click the camera icon to upload a new photo. Large images will be automatically optimized.'}
                    </p>
                    {uploadingAvatar && (
                      <p className="text-sm text-blue-600">
                        {t('uploading') || 'Uploading...'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('firstName') || 'First Name'}
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                    placeholder={t('firstName') || 'First Name'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('lastName') || 'Last Name'}
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={userProfile.lastName}
                    onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
                    placeholder={t('lastName') || 'Last Name'}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('email') || 'Email'}
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('phoneOptional') || 'Phone (Optional)'}
                </label>
                <input
                  type="tel"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-2 text-sm font-medium rounded-md text-white ${
                  saving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {saving 
                  ? (t('saving') || 'Saving...') 
                  : (t('saveProfile') || 'Save Profile')}
              </button>
            </form>
          </div>

          {/* Business Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('businessInformationTitle') || 'Business Information'}
            </h2>
            <form onSubmit={handleSaveBusinessInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('businessName')}
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
                  placeholder={t('yourBusinessName') || 'Your Business Name'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('email')}
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                  placeholder="business@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('address') || 'Address'}
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                  placeholder={t('addressPlaceholder') || '123 Main Street'}
                />
              </div>
              {/* Country Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('country') || 'Country'}
                </label>
                <select
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={businessInfo.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                >
                  <option value="">{t('selectCountry') || 'Select Country'}</option>
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('stateProvince') || 'State/Province'}
                  </label>
                  <select
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={businessInfo.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    disabled={!businessInfo.country}
                  >
                    <option value="">{t('selectStateProvince') || 'Select State/Province'}</option>
                    {availableStates.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('city') || 'City'}
                  </label>
                  <select
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={businessInfo.city}
                    onChange={(e) => setBusinessInfo({...businessInfo, city: e.target.value})}
                    disabled={!businessInfo.country}
                  >
                    <option value="">{t('selectCity') || 'Select City'}</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('postalCode') || 'Postal Code'}
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={businessInfo.postalCode}
                  onChange={(e) => setBusinessInfo({...businessInfo, postalCode: e.target.value})}
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('descriptionTitle') || 'Description'}
                </label>
                <textarea
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  value={businessInfo.description}
                  onChange={(e) => setBusinessInfo({...businessInfo, description: e.target.value})}
                  placeholder={t('businessDescriptionPlaceholder') || 'Brief description of your business'}
                />
              </div>
              
              {/* Business Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('businessLogoTitle') || 'Business Logo'}
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {businessInfo.logo ? (
                      <img
                        src={businessInfo.logo}
                        alt="Business Logo"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBusinessLogoChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500">
                      {t('logoUploadHint') || 'Click the camera icon to upload your business logo. Large images will be automatically optimized.'}
                    </p>
                    {uploadingLogo && (
                      <p className="text-sm text-blue-600">
                        {t('uploading') || 'Uploading...'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('businessType') || 'Business Type'}
                </label>
                <BusinessTypeSelector 
                  value={businessInfo.businessType}
                  onChange={(type) => setBusinessInfo({...businessInfo, businessType: type})}
                  showDescription={false}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (t('saving') || 'Saving...') : t('saveChanges')}
              </button>
            </form>
          </div>

          {/* Schedule Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('scheduleSettingsTitle') || 'Schedule Settings'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('timeIntervalMinutes') || 'Time Interval (minutes)'}
                </label>
                <select
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={scheduleSettings.timeInterval}
                  onChange={(e) => setScheduleSettings({...scheduleSettings, timeInterval: parseInt(e.target.value)})}
                >
                  <option value="15">15 {t('minutesWord') || 'minutes'}</option>
                  <option value="30">30 {t('minutesWord') || 'minutes'}</option>
                  <option value="45">45 {t('minutesWord') || 'minutes'}</option>
                  <option value="60">1 {t('hourLower') || 'hour'}</option>
                  <option value="90">1.5 {t('hoursLower') || 'hours'}</option>
                  <option value="120">2 {t('hoursLower') || 'hours'}</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('startTime') || 'Start Time'}
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={scheduleSettings.startTime}
                    onChange={(e) => setScheduleSettings({...scheduleSettings, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('endTime') || 'End Time'}
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={scheduleSettings.endTime}
                    onChange={(e) => setScheduleSettings({...scheduleSettings, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('workingDays') || 'Working Days'}
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    {day: 0, name: t('sunShort') || 'Sun'},
                    {day: 1, name: t('monShort') || 'Mon'},
                    {day: 2, name: t('tueShort') || 'Tue'},
                    {day: 3, name: t('wedShort') || 'Wed'},
                    {day: 4, name: t('thuShort') || 'Thu'},
                    {day: 5, name: t('friShort') || 'Fri'},
                    {day: 6, name: t('satShort') || 'Sat'}
                  ].map(({day, name}) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkingDay(day)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        scheduleSettings.workingDays.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveSchedule}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (t('saving') || 'Saving...') : t('saveChanges')}
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('notificationSettingsTitle') || 'Notification Settings'}
            </h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  checked={notifications.emailNotifications}
                  onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                />
                <span className="ml-2 text-sm text-gray-700">
                  {t('emailNotifications') || 'Email notifications'}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  checked={notifications.smsNotifications}
                  onChange={(e) => setNotifications({...notifications, smsNotifications: e.target.checked})}
                />
                <span className="ml-2 text-sm text-gray-700">
                  {t('smsNotifications') || 'SMS notifications'}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  checked={notifications.appointmentReminders}
                  onChange={(e) => setNotifications({...notifications, appointmentReminders: e.target.checked})}
                />
                <span className="ml-2 text-sm text-gray-700">
                  {t('appointmentReminders') || 'Appointment reminders'}
                </span>
              </label>
              <button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (t('saving') || 'Saving...') : t('saveChanges')}
              </button>
            </div>
          </div>


          {/* Website Settings */}
          {businessData && (
            <BusinessSettings 
              business={{
                ...businessData,
                settings: businessData.settings
                  ? {
                      theme: businessData.settings.theme ?? undefined,
                      ui: businessData.settings.ui ?? undefined,
                    }
                  : undefined,
              }} 
              onUpdate={(data) => setBusinessData((prev) => {
                const combined = {
                  ...(prev ?? {}),
                  ...data,
                } as Partial<BusinessSettingsResponse>
                return normalizeBusiness(combined)
              })}
            />
          )}

          {/* Email Configuration */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('emailConfigurationTitle') || 'Email Configuration'}
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p className="text-sm text-green-800">
                    {t('emailConfiguredGmail') || 'Email confirmations are configured and working with Gmail.'}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {t('emailsSentWithIcs') || 'Emails are being sent successfully to customers with calendar attachments (.ics files).'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {t('sendConfirmationEmails') || 'Send confirmation emails'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {t('active') || 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {t('includeCalendarFile') || 'Include calendar file (.ics)'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {t('active') || 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dataManagementTitle') || 'Data Management'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('dataManagementHelp') || 'Manage your stored data. Be careful, these actions cannot be undone.'}
            </p>
            <div className="space-y-4">
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {t('clearAllData') || 'Clear All Data'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
