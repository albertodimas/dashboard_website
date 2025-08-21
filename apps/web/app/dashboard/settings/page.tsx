'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'

export default function SettingsPage() {
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    website: '',
    description: ''
  })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true
  })
  const [scheduleSettings, setScheduleSettings] = useState({
    timeInterval: 60,
    startTime: '09:00',
    endTime: '18:00',
    workingDays: [1, 2, 3, 4, 5]
  })

  useEffect(() => {
    // Check authentication and load business info from API
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(async () => {
        try {
          const response = await fetch('/api/dashboard/business')
          if (response.ok) {
            const data = await response.json()
            setBusinessInfo({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              address: data.address || '',
              city: data.city || '',
              state: data.state || '',
              postalCode: data.postalCode || '',
              website: data.website || '',
              description: data.description || ''
            })
            
            // Load settings from the business settings field
            const settings = data.settings || {}
            if (settings.notifications) {
              setNotifications(settings.notifications)
            }
            if (settings.scheduleSettings) {
              setScheduleSettings(settings.scheduleSettings)
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

  const handleSaveBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/dashboard/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessInfo),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save business info')
      }
      
      alert(language === 'en' ? 'Business information saved!' : '¡Información del negocio guardada!')
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
          {/* Language Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Language Preference' : 'Preferencia de Idioma'}
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-md ${
                  language === 'en' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`px-4 py-2 rounded-md ${
                  language === 'es' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Español
              </button>
            </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'City' : 'Ciudad'}
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={businessInfo.city}
                    onChange={(e) => setBusinessInfo({...businessInfo, city: e.target.value})}
                    placeholder={language === 'en' ? 'New York' : 'Nueva York'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'State' : 'Estado'}
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={businessInfo.state}
                    onChange={(e) => setBusinessInfo({...businessInfo, state: e.target.value})}
                    placeholder="NY"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    {language === 'en' ? 'Website' : 'Sitio Web'}
                  </label>
                  <input
                    type="url"
                    className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={businessInfo.website}
                    onChange={(e) => setBusinessInfo({...businessInfo, website: e.target.value})}
                    placeholder="https://www.example.com"
                  />
                </div>
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