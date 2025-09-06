'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, MapPin, User, ArrowLeft, X, Check } from 'lucide-react'

interface Appointment {
  id: string
  businessId: string
  serviceId: string
  staffId: string | null
  startTime: string
  endTime: string
  status: string
  notes: string | null
  service: {
    name: string
    duration: number
    price: number
  }
  business: {
    name: string
    address: string
    city: string
    customSlug: string
    slug: string
  }
  staff: {
    name: string
  } | null
}

export default function ClientAppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (!token) {
      router.push('/cliente/login')
      return
    }
    fetchAppointments(token)
  }, [])

  const fetchAppointments = async (token: string) => {
    try {
      const response = await fetch('/api/cliente/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return

    const token = localStorage.getItem('clientToken')
    if (!token) return

    try {
      const response = await fetch(`/api/cliente/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchAppointments(token)
        setSelectedAppointment(null)
      }
    } catch (error) {
      console.error('Error canceling appointment:', error)
    }
  }

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.startTime) >= new Date() && apt.status !== 'CANCELLED'
  )
  
  const pastAppointments = appointments.filter(apt => 
    new Date(apt.startTime) < new Date() || apt.status === 'CANCELLED'
  )

  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cliente/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            Volver al panel
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Mis Citas</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Próximas ({upcomingAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'past'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pasadas ({pastAppointments.length})
            </button>
          </div>
        </div>

        {/* Appointments List */}
        {displayedAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'upcoming' ? 'No tienes citas próximas' : 'No tienes citas pasadas'}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'upcoming' && '¿Quieres agendar una nueva cita?'}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                href="/cliente/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Explorar servicios
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {displayedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedAppointment(appointment)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {appointment.service.name}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        {new Date(appointment.startTime).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2 text-gray-400" />
                        {new Date(appointment.startTime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {new Date(appointment.endTime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-2 text-gray-400" />
                        {appointment.business.name}
                      </div>
                      {appointment.staff && (
                        <div className="flex items-center">
                          <User size={16} className="mr-2 text-gray-400" />
                          {appointment.staff.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-700'
                        : appointment.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700'
                        : appointment.status === 'COMPLETED'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {appointment.status === 'CONFIRMED' && 'Confirmada'}
                      {appointment.status === 'PENDING' && 'Pendiente'}
                      {appointment.status === 'CANCELLED' && 'Cancelada'}
                      {appointment.status === 'COMPLETED' && 'Completada'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Appointment Detail Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Detalles de la Cita</h2>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Servicio</p>
                  <p className="font-semibold">{selectedAppointment.service.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Fecha y hora</p>
                  <p className="font-semibold">
                    {new Date(selectedAppointment.startTime).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p>
                    {new Date(selectedAppointment.startTime).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {new Date(selectedAppointment.endTime).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Lugar</p>
                  <p className="font-semibold">{selectedAppointment.business.name}</p>
                  <p className="text-sm">{selectedAppointment.business.address}, {selectedAppointment.business.city}</p>
                </div>

                {selectedAppointment.staff && (
                  <div>
                    <p className="text-sm text-gray-500">Profesional</p>
                    <p className="font-semibold">{selectedAppointment.staff.name}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Precio</p>
                  <p className="font-semibold">${selectedAppointment.service.price}</p>
                </div>

                {selectedAppointment.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notas</p>
                    <p>{selectedAppointment.notes}</p>
                  </div>
                )}

                {selectedAppointment.status === 'CONFIRMED' && 
                 new Date(selectedAppointment.startTime) > new Date() && (
                  <div className="pt-4 border-t space-y-2">
                    <Link
                      href={`/${selectedAppointment.business.customSlug || selectedAppointment.business.slug}`}
                      className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      onClick={() => setSelectedAppointment(null)}
                    >
                      Ver negocio
                    </Link>
                    <button
                      onClick={() => handleCancelAppointment(selectedAppointment.id)}
                      className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      Cancelar cita
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}