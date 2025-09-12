'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'
import OperationModeSelector from '@/components/OperationModeSelector'
import BusinessSettings from '@/components/dashboard/BusinessSettings'
import { BusinessTypeSelector } from '@/components/business-type-selector'
import { BusinessType } from '@/lib/business-types'
import { countries, cities } from '@/lib/countries'
import { Camera, User } from 'lucide-react'
import { compressImage, formatFileSize } from '@/lib/image-resize-client'

export default function SettingsPage() {
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userProfile, setUserProfile] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    language: 'en',
    avatar: ''
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [businessInfo, setBusinessInfo] = useState({
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
    businessType: BusinessType.OTHER as string,
    logo: '',
    coverImage: ''
  })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true
  })
  const [scheduleSettings, setScheduleSettings] = useState({
    timeInterval: 30,
    startTime: '',
    endTime: '',
    workingDays: []
  })
  const [operationMode, setOperationMode] = useState<'RESERVA'|'PROYECTO'>('RESERVA')
  const [businessData, setBusinessData] = useState<any>(null)
  const [availableStates, setAvailableStates] = useState<any[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])

  // Handle country change
  const handleCountryChange = (countryCode: string) => {
    setBusinessInfo({...businessInfo, country: countryCode, state: '', city: ''})
    const country = countries.find(c => c.code === countryCode)
    setAvailableStates(country?.states || [])
    setAvailableCities(cities[countryCode as keyof typeof cities] || [])
  }

  // Handle state change  
  const handleStateChange = (stateCode: string) => {
    setBusinessInfo({...businessInfo, state: stateCode, city: ''})
    
    // Find the selected state and load its cities
    const country = countries.find(c => c.code === businessInfo.country)
    const state = country?.states.find(s => s.code === stateCode)
    
    if (state && 'cities' in state) {
      setAvailableCities(state.cities)
    } else {
      // Fallback to general country cities if state doesn't have specific cities
      setAvailableCities(cities[businessInfo.country as keyof typeof cities] || [])
    }
  }

  useEffect(() => {
    // Check authentication and load business info from API
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(async (authData) => {
        // Set user profile from auth data
        setUserProfile({
          name: authData.user.name || '',
          lastName: authData.user.lastName || '',
          email: authData.user.email || '',
          phone: authData.user.phone || '',
          language: authData.user.language || 'en',
          avatar: authData.user.avatar || ''
        })
        
        try {
          const response = await fetch('/api/dashboard/business')
          if (response.ok) {
            const data = await response.json()
            setBusinessData(data)
            setBusinessInfo({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              address: data.address || '',
              city: data.city || '',
              businessType: data.businessType || BusinessType.OTHER,
              businessCategory: data.businessCategory || '',
              state: data.state || '',
              postalCode: data.postalCode || '',
              country: data.country || '',
              website: data.website || '',
              description: data.description || '',
              logo: data.logo || '',
              coverImage: data.coverImage || ''
            })

            // Set available states and cities based on current country and state
            if (data.country) {
              const country = countries.find(c => c.code === data.country)
              setAvailableStates(country?.states || [])
              
              // If there's also a state selected, load cities for that state
              if (data.state && country) {
                const state = country.states.find(s => s.code === data.state)
                if (state && 'cities' in state) {
                  setAvailableCities(state.cities)
                } else {
                  setAvailableCities(cities[data.country as keyof typeof cities] || [])
                }
              } else {
                setAvailableCities(cities[data.country as keyof typeof cities] || [])
              }
            }
            
            // Load settings from the business settings field
            const settings = data.settings || {}
            if (settings.notifications) {
              setNotifications(settings.notifications)
            }
            if (settings.scheduleSettings) {
              setScheduleSettings(settings.scheduleSettings)
            }
            if (settings.operationMode) {
              setOperationMode(settings.operationMode === 'PROYECTO' ? 'PROYECTO' : 'RESERVA')
            }
          }
        } catch (error) {
          console.error('Error loading business info:', error)
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
      alert(language === 'en' ? 'Please select an image file' : 'Por favor selecciona un archivo de imagen')
      return
    }
    
    setUploadingLogo(true)
    
    try {
      // Show original file size
      const originalSize = formatFileSize(file.size)
      console.log(`Original logo size: ${originalSize}`)
      
      // Compress image if needed (max 5MB after compression)
      const compressedFile = await compressImage(file, 5)
      const compressedSize = formatFileSize(compressedFile.size)
      console.log(`Compressed logo size: ${compressedSize}`)
      
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        setBusinessInfo(prev => ({ ...prev, logo: base64String }))
        setUploadingLogo(false)
        
        // Show success message with compression info if file was compressed
        if (file.size !== compressedFile.size) {
          const message = language === 'en' 
            ? `Logo uploaded successfully! (Compressed from ${originalSize} to ${compressedSize})`
            : `¡Logo subido exitosamente! (Comprimido de ${originalSize} a ${compressedSize})`
          console.log(message)
        }
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert(language === 'en' ? 'Failed to upload image' : 'Error al subir la imagen')
      setUploadingLogo(false)
    }
  }

  const handleSaveOperationMode = async () => {
    setSaving(true)
    try {
      const businessResponse = await fetch('/api/dashboard/business')
      const businessData = await businessResponse.json()
      const updatedSettings = {
        ...(businessData.settings || {}),
        operationMode
      }
      const response = await fetch('/api/dashboard/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings }),
      })
      if (!response.ok) throw new Error('Failed to save mode')
      alert(language === 'en' ? 'Operation mode saved!' : '¡Modo de operación guardado!')
    } catch (e) {
      console.error('Error saving operation mode:', e)
      alert(language === 'en' ? 'Failed to save operation mode' : 'Error al guardar el modo de operación')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(language === 'en' ? 'Please select an image file' : 'Por favor selecciona un archivo de imagen')
      return
    }
    
    setUploadingAvatar(true)
    
    try {
      // Show original file size
      const originalSize = formatFileSize(file.size)
      console.log(`Original avatar size: ${originalSize}`)
      
      // Compress image if needed (max 5MB after compression)
      const compressedFile = await compressImage(file, 5)
      const compressedSize = formatFileSize(compressedFile.size)
      console.log(`Compressed avatar size: ${compressedSize}`)
      
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        setUserProfile(prev => ({ ...prev, avatar: base64String }))
        setUploadingAvatar(false)
        
        // Show success message with compression info if file was compressed
        if (file.size !== compressedFile.size) {
          const message = language === 'en' 
            ? `Avatar uploaded successfully! (Compressed from ${originalSize} to ${compressedSize})`
            : `¡Avatar subido exitosamente! (Comprimido de ${originalSize} a ${compressedSize})`
          console.log(message)
        }
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert(language === 'en' ? 'Failed to upload image' : 'Error al subir la imagen')
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

      alert(language === 'en' ? 'Profile saved successfully!' : '¡Perfil guardado exitosamente!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert(language === 'en' ? 'Failed to save profile' : 'Error al guardar el perfil')
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
      
      const result = await response.json()
      
      // Update businessData with new values
      if (result.business) {
        setBusinessData(result.business)
        
        // Show success message with new URL if name changed
        if (result.business.customSlug) {
          const publicUrl = `${window.location.origin}/${result.business.customSlug}`
          alert(
            language === 'en' 
              ? `Business information saved!\nYour public page: ${publicUrl}` 
              : `¡Información del negocio guardada!\nTu página pública: ${publicUrl}`
          )
        } else {
          alert(language === 'en' ? 'Business information saved!' : '¡Información del negocio guardada!')
        }
      }
    } catch (error) {
      console.error('Error saving business info:', error)
      alert(language === 'en' ? 'Failed to save business information' : 'Error al guardar la información del negocio')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      // Get current business settings
      const businessResponse = await fetch('/api/dashboard/business')
      const businessData = await businessResponse.json()
      
      // Update settings with notifications
      const updatedSettings = {
        ...(businessData.settings || {}),
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
      
      alert(language === 'en' ? 'Notification settings saved!' : '¡Configuración de notificaciones guardada!')
    } catch (error) {
      console.error('Error saving notifications:', error)
      alert(language === 'en' ? 'Failed to save notification settings' : 'Error al guardar la configuración de notificaciones')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSchedule = async () => {
    setSaving(true)
    try {
      // Get current business settings
      const businessResponse = await fetch('/api/dashboard/business')
      const businessData = await businessResponse.json()
      
      // Update settings with schedule
      const updatedSettings = {
        ...(businessData.settings || {}),
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
      
      alert(language === 'en' ? 'Schedule settings saved!' : '¡Configuración de horarios guardada!')
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert(language === 'en' ? 'Failed to save schedule settings' : 'Error al guardar la configuración de horarios')
    } finally {
      setSaving(false)
    }
  }

  const toggleWorkingDay = (day: number) => {
    const updatedDays = scheduleSettings.workingDays.includes(day)
      ? scheduleSettings.workingDays.filter(d => d !== day)
      : [...scheduleSettings.workingDays, day].sort()
    setScheduleSettings({...scheduleSettings, workingDays: updatedDays})
  }

  const handleClearData = async () => {
    if (confirm(language === 'en' 
      ? 'Are you sure? This will delete all your data (appointments, customers, services).' 
      : '¿Estás seguro? Esto eliminará todos tus datos (citas, clientes, servicios).')) {
      try {
        // Clear data from database
        await fetch('/api/dashboard/clear-data', { method: 'POST' })
        alert(language === 'en' ? 'All data has been cleared.' : 'Todos los datos han sido eliminados.')
        router.push('/dashboard')
      } catch (error) {
        console.error('Error clearing data:', error)
        alert(language === 'en' ? 'Failed to clear data' : 'Error al eliminar los datos')
      }
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
            {language === 'en' ? 'Manage your account and application settings' : 'Administra tu cuenta y configuración de la aplicación'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Operation Mode */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {language === 'en' ? 'Operation Mode' : 'Modo de Operación'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">{t('operationModeDesc')}</p>
            <OperationModeSelector value={operationMode} onChange={setOperationMode as any} />
            <button
              onClick={handleSaveOperationMode}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {saving ? (language === 'en' ? 'Saving...' : 'Guardando...') : (language === 'en' ? 'Save' : 'Guardar')}
            </button>
          </div>
          {/* Language preference managed from top-right selector. Block removed to avoid duplication. */}

          {/* User Profile */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'User Profile' : 'Perfil de Usuario'}
            </h2>
            <form onSubmit={handleSaveUserProfile} className="space-y-4">
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'Profile Photo' : 'Foto de Perfil'}
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
                      {language === 'en' 
                        ? 'Click the camera icon to upload a new photo. Large images will be automatically optimized.'
                        : 'Haz clic en el ícono de la cámara para subir una nueva foto. Las imágenes grandes se optimizarán automáticamente.'}
                    </p>
                    {uploadingAvatar && (
                      <p className="text-sm text-blue-600">
                        {language === 'en' ? 'Uploading...' : 'Subiendo...'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'First Name' : 'Nombre'}
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                    placeholder={language === 'en' ? 'First Name' : 'Nombre'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'Last Name' : 'Apellidos'}
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={userProfile.lastName}
                    onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
                    placeholder={language === 'en' ? 'Last Name' : 'Apellidos'}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {language === 'en' ? 'Email' : 'Correo Electrónico'}
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
                  {language === 'en' ? 'Phone (Optional)' : 'Teléfono (Opcional)'}
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
                  ? (language === 'en' ? 'Saving...' : 'Guardando...') 
                  : (language === 'en' ? 'Save Profile' : 'Guardar Perfil')}
              </button>
            </form>
          </div>

          {/* Business Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Business Information' : 'Información del Negocio'}
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
                  placeholder={language === 'en' ? 'Your Business Name' : 'Nombre de tu Negocio'}
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
                  {language === 'en' ? 'Address' : 'Dirección'}
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                  placeholder={language === 'en' ? '123 Main Street' : '123 Calle Principal'}
                />
              </div>
              {/* Country Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {language === 'en' ? 'Country' : 'País'}
                </label>
                <select
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={businessInfo.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                >
                  <option value="">{language === 'en' ? 'Select Country' : 'Seleccionar País'}</option>
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
                    {language === 'en' ? 'State/Province' : 'Estado/Provincia'}
                  </label>
                  <select
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={businessInfo.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    disabled={!businessInfo.country}
                  >
                    <option value="">{language === 'en' ? 'Select State/Province' : 'Seleccionar Estado/Provincia'}</option>
                    {availableStates.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'City' : 'Ciudad'}
                  </label>
                  <select
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={businessInfo.city}
                    onChange={(e) => setBusinessInfo({...businessInfo, city: e.target.value})}
                    disabled={!businessInfo.country}
                  >
                    <option value="">{language === 'en' ? 'Select City' : 'Seleccionar Ciudad'}</option>
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
                  {language === 'en' ? 'Postal Code' : 'Código Postal'}
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
                  {language === 'en' ? 'Description' : 'Descripción'}
                </label>
                <textarea
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  value={businessInfo.description}
                  onChange={(e) => setBusinessInfo({...businessInfo, description: e.target.value})}
                  placeholder={language === 'en' ? 'Brief description of your business' : 'Breve descripción de tu negocio'}
                />
              </div>
              
              {/* Business Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'Business Logo' : 'Logo del Negocio'}
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
                      {language === 'en' 
                        ? 'Click the camera icon to upload your business logo. Large images will be automatically optimized.'
                        : 'Haz clic en el ícono de la cámara para subir el logo de tu negocio. Las imágenes grandes se optimizarán automáticamente.'}
                    </p>
                    {uploadingLogo && (
                      <p className="text-sm text-blue-600">
                        {language === 'en' ? 'Uploading...' : 'Subiendo...'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'Business Type' : 'Tipo de Negocio'}
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
                {saving ? (language === 'en' ? 'Saving...' : 'Guardando...') : t('saveChanges')}
              </button>
            </form>
          </div>

          {/* Schedule Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Schedule Settings' : 'Configuración de Horarios'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'Time Interval (minutes)' : 'Intervalo de Tiempo (minutos)'}
                </label>
                <select
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={scheduleSettings.timeInterval}
                  onChange={(e) => setScheduleSettings({...scheduleSettings, timeInterval: parseInt(e.target.value)})}
                >
                  <option value="15">15 {language === 'en' ? 'minutes' : 'minutos'}</option>
                  <option value="30">30 {language === 'en' ? 'minutes' : 'minutos'}</option>
                  <option value="45">45 {language === 'en' ? 'minutes' : 'minutos'}</option>
                  <option value="60">1 {language === 'en' ? 'hour' : 'hora'}</option>
                  <option value="90">1.5 {language === 'en' ? 'hours' : 'horas'}</option>
                  <option value="120">2 {language === 'en' ? 'hours' : 'horas'}</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Start Time' : 'Hora de Inicio'}
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
                    {language === 'en' ? 'End Time' : 'Hora de Fin'}
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
                  {language === 'en' ? 'Working Days' : 'Días de Trabajo'}
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    {day: 0, name: language === 'en' ? 'Sun' : 'Dom'},
                    {day: 1, name: language === 'en' ? 'Mon' : 'Lun'},
                    {day: 2, name: language === 'en' ? 'Tue' : 'Mar'},
                    {day: 3, name: language === 'en' ? 'Wed' : 'Mié'},
                    {day: 4, name: language === 'en' ? 'Thu' : 'Jue'},
                    {day: 5, name: language === 'en' ? 'Fri' : 'Vie'},
                    {day: 6, name: language === 'en' ? 'Sat' : 'Sáb'}
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
                {saving ? (language === 'en' ? 'Saving...' : 'Guardando...') : t('saveChanges')}
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Notification Settings' : 'Configuración de Notificaciones'}
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
                  {language === 'en' ? 'Email notifications' : 'Notificaciones por correo'}
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
                  {language === 'en' ? 'SMS notifications' : 'Notificaciones por SMS'}
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
                  {language === 'en' ? 'Appointment reminders' : 'Recordatorios de citas'}
                </span>
              </label>
              <button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (language === 'en' ? 'Saving...' : 'Guardando...') : t('saveChanges')}
              </button>
            </div>
          </div>


          {/* Website Settings */}
          {businessData && (
            <BusinessSettings 
              business={businessData} 
              onUpdate={(data) => setBusinessData({...businessData, ...data})}
            />
          )}

          {/* Email Configuration */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Email Configuration' : 'Configuración de Email'}
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p className="text-sm text-green-800">
                    {language === 'en' 
                      ? 'Email confirmations are configured and working with Gmail.'
                      : 'Las confirmaciones por email están configuradas y funcionando con Gmail.'}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {language === 'en' 
                      ? 'Emails are being sent successfully to customers with calendar attachments (.ics files).'
                      : 'Los emails se están enviando exitosamente a los clientes con archivos de calendario adjuntos (.ics).'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {language === 'en' ? 'Send confirmation emails' : 'Enviar emails de confirmación'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {language === 'en' ? 'Active' : 'Activo'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {language === 'en' ? 'Include calendar file (.ics)' : 'Incluir archivo de calendario (.ics)'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {language === 'en' ? 'Active' : 'Activo'}
                </span>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Data Management' : 'Gestión de Datos'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {language === 'en' 
                ? 'Manage your stored data. Be careful, these actions cannot be undone.'
                : 'Gestiona tus datos almacenados. Ten cuidado, estas acciones no se pueden deshacer.'}
            </p>
            <div className="space-y-4">
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {language === 'en' ? 'Clear All Data' : 'Eliminar Todos los Datos'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
