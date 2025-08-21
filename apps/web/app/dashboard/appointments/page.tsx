'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'

interface Appointment {
  id: string
  customerName: string
  service: string
  date: string
  time: string
  status: 'confirmed' | 'pending' | 'cancelled'
  price: number
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
  isActive: boolean
}

export default function AppointmentsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    service: '',
    date: '',
    time: '',
    price: 0
  })

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/dashboard/appointments')
      if (!response.ok) {
        throw new Error('Failed to load appointments')
      }
      const data = await response.json()
      // Ensure we always have an array
      setAppointments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      const response = await fetch('/api/dashboard/services')
      if (!response.ok) {
        throw new Error('Failed to load services')
      }
      const data = await response.json()
      // Filter only active services
      setServices(Array.isArray(data) ? data.filter((s: Service) => s.isActive) : [])
    } catch (err) {
      console.error('Failed to load services:', err)
    }
  }

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(() => {
        // Load appointments and services from API
        loadAppointments()
        loadServices()
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])


  const handleCancelAppointment = async (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId)
    if (!appointment) return
    
    try {
      setSaving(true)
      setError(null)
      
      // Si ya está cancelada, preguntar si quiere eliminarla
      if (appointment.status === 'cancelled') {
        if (confirm(t('delete') + '?')) {
          const response = await fetch(`/api/dashboard/appointments?id=${appointmentId}`, {
            method: 'DELETE',
          })
          if (!response.ok) {
            throw new Error('Failed to delete appointment')
          }
          await loadAppointments() // Reload appointments after deletion
        }
      } else {
        // Si no está cancelada, cambiar el estado a cancelada
        if (confirm(t('cancel') + '?')) {
          const response = await fetch('/api/dashboard/appointments', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...appointment, status: 'cancelled' }),
          })
          if (!response.ok) {
            throw new Error('Failed to cancel appointment')
          }
          await loadAppointments() // Reload appointments after update
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId)
    if (appointment && appointment.status !== 'cancelled') {
      try {
        setSaving(true)
        setError(null)
        
        const newStatus = appointment.status === 'pending' ? 'confirmed' : 'pending'
        const response = await fetch('/api/dashboard/appointments', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...appointment, status: newStatus }),
        })
        if (!response.ok) {
          throw new Error('Failed to update appointment status')
        }
        
        await loadAppointments() // Reload appointments after update
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update appointment status')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setFormData({
      customerName: appointment.customerName,
      service: appointment.service,
      date: appointment.date,
      time: appointment.time,
      price: appointment.price
    })
    loadServices() // Reload services when opening edit modal
    setShowEditModal(true)
  }

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingAppointment) {
      try {
        setSaving(true)
        setError(null)
        
        const response = await fetch('/api/dashboard/appointments', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            ...formData, 
            id: editingAppointment.id,
            status: editingAppointment.status // Keep existing status
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to update appointment')
        }
        
        setShowEditModal(false)
        setEditingAppointment(null)
        setFormData({
          customerName: '',
          service: '',
          date: '',
          time: '',
          price: 0
        })
        await loadAppointments() // Reload appointments after update
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update appointment')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        throw new Error('Failed to create appointment')
      }
      
      setShowAddModal(false)
      setFormData({
        customerName: '',
        service: '',
        date: '',
        time: '',
        price: 0
      })
      await loadAppointments() // Reload appointments after creation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment')
    } finally {
      setSaving(false)
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter.toLowerCase()
    const matchesDate = !dateFilter || apt.date === dateFilter
    return matchesStatus && matchesDate
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return t('confirmed')
      case 'pending':
        return t('pending')
      case 'cancelled':
        return t('cancelled')
      default:
        return status
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800">Error Loading Appointments</h3>
            <p className="text-red-600 mt-2">{error}</p>
            <button 
              onClick={loadAppointments}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('appointmentsTitle')}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {t('appointmentsSubtitle')}
            </p>
          </div>
          <button 
            onClick={() => {
              loadServices() // Load services when opening add modal
              setShowAddModal(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {t('newAppointmentBtn')}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select 
            className="rounded-md border-gray-300 shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('allStatus')}</option>
            <option value="confirmed">{t('confirmed')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>
          <input
            type="date"
            className="rounded-md border-gray-300 shadow-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {/* Appointments Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('service')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dateTime')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('price')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {appointment.customerName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{appointment.service}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {appointment.date} {t('at')} {appointment.time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${appointment.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(appointment.id)}
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-all transform ${getStatusBadge(appointment.status)} ${
                        appointment.status !== 'cancelled' ? 'hover:scale-105 hover:shadow-md cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-75'
                      }`}
                      disabled={appointment.status === 'cancelled'}
                      title={appointment.status !== 'cancelled' ? (t('language') === 'en' ? 'Click to change status' : 'Clic para cambiar estado') : ''}
                    >
                      {getStatusText(appointment.status)}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {appointment.status !== 'cancelled' && (
                      <button 
                        onClick={() => handleEditAppointment(appointment)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        {t('edit')}
                      </button>
                    )}
                    <button 
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className={
                        appointment.status === 'cancelled' 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-orange-600 hover:text-orange-900'
                      }
                    >
                      {appointment.status === 'cancelled' ? t('delete') : t('cancel')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAppointments.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">{t('noAppointments')}</p>
          </div>
        )}

        {/* Edit Appointment Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{t('edit')} {t('appointments').toLowerCase()}</h2>
              <form className="space-y-4" onSubmit={handleUpdateAppointment}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('customerName')}</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('service')}</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={formData.service}
                    onChange={(e) => {
                      const selectedService = services.find(s => s.name === e.target.value)
                      setFormData({
                        ...formData, 
                        service: e.target.value,
                        price: selectedService?.price || formData.price
                      })
                    }}
                    required
                  >
                    <option value="">{t('selectService')}</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.name}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('date')}</label>
                    <input
                      type="date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('time')}</label>
                    <input
                      type="time"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('price')} ($)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingAppointment(null)
                      setFormData({
                        customerName: '',
                        service: '',
                        date: '',
                        time: '',
                        price: 0
                      })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (t('language') === 'en' ? 'Saving...' : 'Guardando...') : t('saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Appointment Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{t('newAppointment')}</h2>
              <form className="space-y-4" onSubmit={handleAddAppointment}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('customerName')}</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="John Doe"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('service')}</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={formData.service}
                    onChange={(e) => {
                      const selectedService = services.find(s => s.name === e.target.value)
                      setFormData({
                        ...formData, 
                        service: e.target.value,
                        price: selectedService?.price || formData.price
                      })
                    }}
                    required
                  >
                    <option value="">{t('selectService')}</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.name}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('date')}</label>
                    <input
                      type="date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('time')}</label>
                    <input
                      type="time"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('price')} ($)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="35"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setFormData({
                        customerName: '',
                        service: '',
                        date: '',
                        time: '',
                        price: 0
                      })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (t('language') === 'en' ? 'Creating...' : 'Creando...') : t('createAppointment')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}