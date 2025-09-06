'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Package, Calendar, Clock, User, LogOut, ChevronRight, 
  Gift, MapPin, Phone, Mail, Star, Home, History, Plus,
  Building2, Sparkles
} from 'lucide-react'
import Link from 'next/link'

interface Package {
  id: string
  remainingSessions: number
  expiryDate: string | null
  package: {
    name: string
    business: {
      name: string
      slug: string
    }
    services: Array<{
      service: {
        name: string
      }
      quantity: number
    }>
  }
}

interface Appointment {
  id: string
  startTime: string
  status: string
  service: {
    name: string
    duration: number
  }
  business: {
    name: string
    address: string
  }
  staff?: {
    name: string
  }
}

interface Business {
  id: string
  name: string
  description?: string
  address: string
  city: string
  state: string
  slug: string
  customSlug?: string
  businessCategory?: string
  appointmentCount?: number
  serviceCount?: number
  rating?: number
  reviewCount?: number
  isPremium?: boolean
}

export default function ClientDashboard() {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([])
  const [suggestedBusinesses, setSuggestedBusinesses] = useState<Business[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'appointments' | 'profile'>('overview')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    const customerData = localStorage.getItem('clientData')
    
    if (!token || !customerData) {
      router.push('/cliente/login')
      return
    }

    setCustomer(JSON.parse(customerData))
    fetchDashboardData(token)
  }, [])

  const fetchDashboardData = async (token: string) => {
    try {
      // Fetch dashboard data
      const dashboardResponse = await fetch('/api/cliente/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json()
        setPackages(data.packages || [])
        setAppointments(data.appointments || [])
      }

      // Fetch businesses data
      const businessesResponse = await fetch('/api/cliente/businesses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (businessesResponse.ok) {
        const businessData = await businessesResponse.json()
        setMyBusinesses(businessData.myBusinesses || [])
        setSuggestedBusinesses(businessData.suggestedBusinesses || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('clientToken')
    localStorage.removeItem('clientData')
    router.push('/cliente/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalSessions = packages.reduce((acc, pkg) => acc + pkg.remainingSessions, 0)
  const activePackages = packages.filter(pkg => pkg.remainingSessions > 0)
  const upcomingAppointments = appointments.filter(apt => apt.status !== 'CANCELLED')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Mi Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{customer?.name}</p>
                <p className="text-xs text-gray-500">{customer?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Cerrar sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 border-t -mb-px mt-4">
            {[
              { id: 'overview', label: 'Resumen', icon: Home },
              { id: 'packages', label: 'Mis Paquetes', icon: Package },
              { id: 'appointments', label: 'Mis Citas', icon: Calendar },
              { id: 'profile', label: 'Mi Perfil', icon: User }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sesiones Disponibles</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{totalSessions}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Gift className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Paquetes Activos</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{activePackages.length}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Package className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Próximas Citas</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingAppointments.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Calendar className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/cliente/packages"
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Package className="text-blue-600" size={24} />
                    <span className="font-medium">Ver mis paquetes</span>
                  </div>
                  <ChevronRight className="text-gray-400" size={20} />
                </Link>

                <Link
                  href="/cliente/appointments"
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="text-green-600" size={24} />
                    <span className="font-medium">Ver mis citas</span>
                  </div>
                  <ChevronRight className="text-gray-400" size={20} />
                </Link>
              </div>
            </div>

            {/* Upcoming Appointments Preview */}
            {upcomingAppointments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximas Citas</h2>
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-gray-400" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">{apt.service.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(apt.startTime).toLocaleDateString()} - {new Date(apt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {apt.status === 'CONFIRMED' ? 'Confirmada' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mis Negocios Section */}
            {myBusinesses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Mis Negocios</h2>
                  <Building2 className="text-gray-400" size={24} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myBusinesses.map((business) => (
                    <Link
                      key={business.id}
                      href={`/${business.customSlug || business.slug}`}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <h3 className="font-medium text-gray-900 mb-1">{business.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {business.city}, {business.state}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{business.serviceCount || 0} servicios</span>
                        {business.appointmentCount > 0 && (
                          <span className="text-blue-600 font-medium">
                            {business.appointmentCount} citas
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Explorar Otros Servicios Section */}
            {suggestedBusinesses.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Descubre Nuevos Servicios</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Negocios recomendados para ti
                    </p>
                  </div>
                  <Sparkles className="text-purple-500" size={24} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedBusinesses.slice(0, 6).map((business) => (
                    <Link
                      key={business.id}
                      href={`/${business.customSlug || business.slug}`}
                      className="bg-white rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      {business.isPremium && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full mb-2">
                          Premium
                        </span>
                      )}
                      <h3 className="font-medium text-gray-900 mb-1">{business.name}</h3>
                      {business.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {business.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          {business.serviceCount || 0} servicios
                        </span>
                        {business.rating > 0 && (
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                            <span className="text-gray-700 font-medium">
                              {business.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                {suggestedBusinesses.length > 6 && (
                  <div className="mt-4 text-center">
                    <Link
                      href="/cliente/businesses"
                      className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Ver todos los negocios disponibles
                      <ChevronRight size={16} className="ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Mis Paquetes</h2>
              <Link
                href="/cliente/businesses"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Comprar Paquete
              </Link>
            </div>

            {packages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Package className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes paquetes activos</h3>
                <p className="text-gray-500 mb-4">Compra un paquete para empezar a disfrutar de nuestros servicios</p>
                <Link
                  href="/cliente/businesses"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Explorar Paquetes
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{pkg.package.name}</h3>
                        <p className="text-sm text-gray-500">{pkg.package.business.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{pkg.remainingSessions}</p>
                        <p className="text-xs text-gray-500">sesiones</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">Servicios incluidos:</p>
                      {pkg.package.services.map((ps, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-700">
                          <Check className="text-green-500 mr-2" size={16} />
                          {ps.service.name} ({ps.quantity} sesiones)
                        </div>
                      ))}
                    </div>

                    {pkg.expiryDate && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-500">
                          Válido hasta: {new Date(pkg.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <Link
                      href={`/${pkg.package.business.slug}`}
                      className="mt-4 w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg text-center block hover:shadow-lg transition-all"
                    >
                      Usar Paquete
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Mis Citas</h2>
              <Link
                href="/cliente/businesses"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Nueva Cita
              </Link>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes citas programadas</h3>
                <p className="text-gray-500 mb-4">Reserva tu primera cita y comienza a disfrutar de nuestros servicios</p>
                <Link
                  href="/cliente/businesses"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Reservar Cita
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Calendar className="text-blue-600" size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{apt.service.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{apt.business.name}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-500 flex items-center">
                              <Clock className="mr-1" size={14} />
                              {new Date(apt.startTime).toLocaleString()}
                            </p>
                            {apt.staff && (
                              <p className="text-sm text-gray-500 flex items-center">
                                <User className="mr-1" size={14} />
                                Con {apt.staff.name}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="mr-1" size={14} />
                              {apt.business.address}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        apt.status === 'CONFIRMED' 
                          ? 'bg-green-100 text-green-700' 
                          : apt.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {apt.status === 'CONFIRMED' ? 'Confirmada' : apt.status === 'CANCELLED' ? 'Cancelada' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Mi Perfil</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <p className="text-gray-900">{customer?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{customer?.email}</p>
              </div>
              {customer?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <p className="text-gray-900">{customer?.phone}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Add missing Check import at the top
const Check = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)