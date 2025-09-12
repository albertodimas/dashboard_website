'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Package, Calendar, Clock, User, LogOut, ChevronRight, 
  Gift, MapPin, Phone, Mail, Star, Home, History, Plus,
  Building2, Sparkles, Compass, ShieldCheck, Edit2, Save, X,
  Trash2, AlertCircle, XCircle, ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface Package {
  id: string
  remainingSessions: number
  expiryDate: string | null
  package: {
    name: string
    business: {
      id: string
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
    id: string
    name: string
    address: string
    phone?: string
    slug?: string
    customSlug?: string
  }
  staff?: {
    name: string
  }
}

interface Business {
  id: string
  name: string
  description?: string
  logo?: string
  imageUrl?: string
  address: string
  city: string
  state: string
  slug: string
  customSlug?: string
  businessType?: string
  appointmentCount?: number
  serviceCount?: number
  rating?: number
  reviewCount?: number
  isPremium?: boolean
  category?: {
    id: string
    name: string
    slug: string
    icon?: string
    color?: string
  }
  customerId?: string
  phone?: string
  email?: string
  zipCode?: string
}

// Componente de sección de perfil
function ProfileSection({ customer, onProfileUpdate }: { customer: any, onProfileUpdate: (customer: any) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    lastName: customer?.lastName || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    postalCode: customer?.postalCode || ''
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        lastName: customer.lastName || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        postalCode: customer.postalCode || ''
      })
    }
  }, [customer])

  const handleCancel = () => {
    setFormData({
      name: customer?.name || '',
      lastName: customer?.lastName || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      city: customer?.city || '',
      state: customer?.state || '',
      postalCode: customer?.postalCode || ''
    })
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setIsSaving(true)

    // Validaciones
    if (!formData.name || formData.name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      setIsSaving(false)
      return
    }

    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/[\s-]/g, '')
      if (!/^\+?\d{7,15}$/.test(cleanPhone)) {
        setError('El teléfono debe contener entre 7 y 15 dígitos')
        setIsSaving(false)
        return
      }
    }

    try {
      const response = await fetch('/api/cliente/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al actualizar el perfil')
        setIsSaving(false)
        return
      }

      setSuccess('Perfil actualizado exitosamente')
      setIsEditing(false)
      onProfileUpdate(data.customer)
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Error al actualizar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Mi Perfil</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 size={16} className="mr-2" />
            Editar Perfil
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Guardar
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <X size={16} className="mr-2" />
              Cancelar
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Juan"
            />
          ) : (
            <p className="text-gray-900 py-2">{customer?.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellidos
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Pérez García"
            />
          ) : (
            <p className="text-gray-900 py-2">{customer?.lastName || 'No especificado'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (no editable)
          </label>
          <p className="text-gray-900 py-2 bg-gray-50 px-4 rounded-lg">{customer?.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1234567890"
            />
          ) : (
            <p className="text-gray-900 py-2">{customer?.phone || 'No especificado'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Calle 123"
            />
          ) : (
            <p className="text-gray-900 py-2">{customer?.address || 'No especificado'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ciudad
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Miami"
            />
          ) : (
            <p className="text-gray-900 py-2">{customer?.city || 'No especificado'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="FL"
            />
          ) : (
            <p className="text-gray-900 py-2">{customer?.state || 'No especificado'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código Postal
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="12345"
            />
          ) : (
            <p className="text-gray-900 py-2">{customer?.postalCode || 'No especificado'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Miembro desde
          </label>
          <p className="text-gray-900 py-2">
            {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'No disponible'}
          </p>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 text-sm text-gray-500">
          * Campo requerido. El email no puede ser modificado ya que se usa como identificador único.
        </div>
      )}
    </div>
  )
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
  const [showBusinessSelector, setShowBusinessSelector] = useState(false)
  const [businessToUnregister, setBusinessToUnregister] = useState<Business | null>(null)
  const [isUnregistering, setIsUnregistering] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [preferredBusinessId, setPreferredBusinessId] = useState<string | null>(() => {
    // Inicializar el preferredBusinessId desde la URL inmediatamente
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const from = searchParams.get('from')
      if (from) {
        const decodedFrom = decodeURIComponent(from)
        console.log('🔍 [dashboard] From parameter:', decodedFrom)
        
        let businessSlugOrId = null
        
        if (decodedFrom.includes('://')) {
          const url = new URL(decodedFrom)
          const path = url.pathname
          const pathMatch = path.match(/^\/([^\/\?#]+)/)
          if (pathMatch) {
            businessSlugOrId = pathMatch[1]
            if (businessSlugOrId === 'cliente') {
              businessSlugOrId = null
            }
          }
        } else if (decodedFrom.startsWith('/')) {
          const businessMatch = decodedFrom.match(/\/(?:business|b)\/([^\/\?#]+)/)
          const directMatch = decodedFrom.match(/^\/([^\/\?#]+)/)
          
          if (businessMatch) {
            businessSlugOrId = businessMatch[1]
          } else if (directMatch) {
            businessSlugOrId = directMatch[1]
            if (businessSlugOrId === 'cliente') {
              businessSlugOrId = null
            }
          }
        } else {
          businessSlugOrId = decodedFrom
        }
        
        if (businessSlugOrId) {
          console.log('🎯 [dashboard] Preferred business detected:', businessSlugOrId)
          return businessSlugOrId
        }
      }
    }
    return null
  })

  useEffect(() => {
    // Obtener el preferredBusinessId de la URL
    let businessIdFromUrl: string | null = null
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const from = searchParams.get('from')
      if (from) {
        const decodedFrom = decodeURIComponent(from)
        console.log('🔍 [useEffect] From parameter:', decodedFrom)
        
        let businessSlugOrId = null
        
        if (decodedFrom.includes('://')) {
          const url = new URL(decodedFrom)
          const path = url.pathname
          const pathMatch = path.match(/^\/([^\/\?#]+)/)
          if (pathMatch) {
            businessSlugOrId = pathMatch[1]
            if (businessSlugOrId === 'cliente') {
              businessSlugOrId = null
            }
          }
        } else if (decodedFrom.startsWith('/')) {
          const businessMatch = decodedFrom.match(/\/(?:business|b)\/([^\/\?#]+)/)
          const directMatch = decodedFrom.match(/^\/([^\/\?#]+)/)
          
          if (businessMatch) {
            businessSlugOrId = businessMatch[1]
          } else if (directMatch) {
            businessSlugOrId = directMatch[1]
            if (businessSlugOrId === 'cliente') {
              businessSlugOrId = null
            }
          }
        } else {
          businessSlugOrId = decodedFrom
        }
        
        if (businessSlugOrId) {
          console.log('🎯 [useEffect] Preferred business detected:', businessSlugOrId)
          businessIdFromUrl = businessSlugOrId
        }
      }
    }
    
    fetchDashboardData(businessIdFromUrl)
  }, [])

  const fetchDashboardData = async (preferredBizId: string | null = null) => {
    try {
      console.log('🚀 [fetchDashboardData] Starting...')
      // Primero intenta leer el perfil actual de forma directa
      try {
        const meRes = await fetch('/api/cliente/auth/me', { credentials: 'include' })
        if (meRes.ok) {
          const me = await meRes.json()
          if (me?.customer) setCustomer(me.customer)
        }
      } catch {}
      
      // Fetch dashboard data
      console.log('?? [fetchDashboardData] Fetching /api/cliente/dashboard')
      const qs = preferredBizId ? ('?from=' + encodeURIComponent(preferredBizId)) : ''
      const dashboardResponse = await fetch('/api/cliente/dashboard' + qs, { credentials: 'include' })

      console.log('📦 [fetchDashboardData] Dashboard response status:', dashboardResponse.status)
      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json()
        console.log('✅ [fetchDashboardData] Dashboard data received:', {
          packagesCount: data.packages?.length || 0,
          appointmentsCount: data.appointments?.length || 0,
          myBusinessesCount: data.myBusinesses?.length || 0,
          businessesToExploreCount: data.businessesToExplore?.length || 0,
          customer: data.customer
        })
        
        // Priorizar paquetes y citas según el negocio referente
        const bizIdToUse = preferredBizId || preferredBusinessId || data.referringBusinessId
        
        // Ordenar paquetes: los del negocio referente primero
        let orderedPackages = data.packages || []
        if (bizIdToUse && orderedPackages.length > 0) {
          orderedPackages = orderedPackages.sort((a: Package, b: Package) => {
            // Prefer by business id (support both nested id and scalar businessId on package)
            const aBizId = (a as any)?.package?.business?.id || (a as any)?.package?.businessId
            const bBizId = (b as any)?.package?.business?.id || (b as any)?.package?.businessId
            const aIsPreferred = aBizId === bizIdToUse
            const bIsPreferred = bBizId === bizIdToUse
            if (aIsPreferred && !bIsPreferred) return -1
            if (!aIsPreferred && bIsPreferred) return 1
            // Si ambos son del mismo negocio, ordenar por sesiones restantes (mayor primero)
            return b.remainingSessions - a.remainingSessions
          })
        }
        
        // Ordenar citas: las del negocio referente primero
        let orderedAppointments = data.appointments || []
        if (bizIdToUse && orderedAppointments.length > 0) {
          orderedAppointments = orderedAppointments.sort((a: Appointment, b: Appointment) => {
            const aIsPreferred = (a as any)?.business?.id === bizIdToUse
            const bIsPreferred = (b as any)?.business?.id === bizIdToUse
            if (aIsPreferred && !bIsPreferred) return -1
            if (!aIsPreferred && bIsPreferred) return 1
            // Si ambos son del mismo negocio, ordenar por fecha (más próxima primero)
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          })
        }
        
        // Set all data from dashboard response
        setPackages(orderedPackages)
        setAppointments(orderedAppointments)
        
        if (data.customer) {
          setCustomer(data.customer)
        } else {
          // Fallback: consultar /auth/me si el dashboard no devolvió customer
          try {
            const meRes = await fetch('/api/cliente/auth/me', { credentials: 'include' })
            if (meRes.ok) {
              const me = await meRes.json()
              if (me?.customer) setCustomer(me.customer)
            }
          } catch (e) {
            // ignore
          }
        }
        
        // Handle businesses data
        if (data.myBusinesses && data.myBusinesses.length > 0) {
          console.log('✅ [fetchDashboardData] Setting myBusinesses with data:', data.myBusinesses)
          
          // Reordenar si hay un negocio preferido
          let orderedBusinesses = data.myBusinesses
          const bizIdToUse = preferredBizId || preferredBusinessId || data.referringBusinessId
          if (bizIdToUse) {
            console.log('🔍 [fetchDashboardData] Aplicando orden con preferido:', bizIdToUse)
            const preferredIndex = orderedBusinesses.findIndex((b: Business) => 
              b.id === bizIdToUse || 
              b.slug === bizIdToUse || 
              b.customSlug === bizIdToUse
            )
            
            if (preferredIndex > 0) {
              // Mover el negocio preferido al principio
              const preferred = orderedBusinesses[preferredIndex]
              orderedBusinesses = [
                preferred,
                ...orderedBusinesses.slice(0, preferredIndex),
                ...orderedBusinesses.slice(preferredIndex + 1)
              ]
              console.log('🎯 [fetchDashboardData] Reordenado con', preferred.name, 'primero')
            }
          }
          
          setMyBusinesses(orderedBusinesses)
        } else {
          console.warn('⚠️ [fetchDashboardData] No businesses found for user')
          setMyBusinesses([])
        }
        
        // Set businesses to explore
        setSuggestedBusinesses(data.businessesToExplore || [])
        
      } else if (dashboardResponse.status === 401) {
        console.error('❌ [fetchDashboardData] Not authenticated, redirecting to login')
        router.push('/cliente/login')
        return
      } else {
        console.error('❌ [fetchDashboardData] Dashboard request failed:', dashboardResponse.status)
      }
    } catch (error) {
      console.error('❌ [fetchDashboardData] Error:', error)
    } finally {
      console.log('🏁 [fetchDashboardData] Finished loading')
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Llamar a la API de logout para limpiar la cookie del servidor
      const response = await fetch('/api/cliente/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Importante para incluir cookies
      })
      
      if (response.ok) {
        // Redirigir al login después de limpiar la sesión del servidor
        router.push('/cliente/login')
      }
    } catch (error) {
      console.error('Error durante logout:', error)
      // Incluso si hay error, redirigir
      router.push('/cliente/login')
    }
  }

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return

    setIsCancelling(true)
    try {
      const response = await fetch('/api/cliente/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointmentToCancel.id })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al cancelar la cita')
        return
      }

      // Actualizar la lista de citas
      setAppointments(appointments.map(apt => 
        apt.id === appointmentToCancel.id 
          ? { ...apt, status: 'CANCELLED' }
          : apt
      ))
      setAppointmentToCancel(null)
      alert('Cita cancelada exitosamente')
      
      // Recargar datos
      fetchDashboardData()
    } catch (error) {
      alert('Error al procesar la solicitud')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleUnregisterBusiness = async () => {
    if (!businessToUnregister) return

    setIsUnregistering(true)
    try {
      const response = await fetch('/api/cliente/businesses/unregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: businessToUnregister.id })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al desregistrarse del negocio')
        return
      }

      // Actualizar la lista de negocios
      setMyBusinesses(myBusinesses.filter(b => b.id !== businessToUnregister.id))
      setBusinessToUnregister(null)
      alert('Te has desregistrado exitosamente del negocio')
    } catch (error) {
      alert('Error al procesar la solicitud')
    } finally {
      setIsUnregistering(false)
    }
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
      {/* Botón Flotante de Ver Servicios - Siempre Visible */}
      {myBusinesses.length === 1 && (
        <Link
          href={`/${myBusinesses[0].customSlug || myBusinesses[0].slug}#services`}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all flex items-center group"
        >
          <Calendar className="mr-0 group-hover:mr-2 transition-all" size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
            Ver Servicios
          </span>
        </Link>
      )}
      
      {/* Botón Flotante con Selector si hay múltiples negocios */}
      {myBusinesses.length > 1 && (
        <>
          <button
            onClick={() => setShowBusinessSelector(!showBusinessSelector)}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all flex items-center group"
          >
            <Calendar className="mr-0 group-hover:mr-2 transition-all" size={24} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
              Ver Servicios
            </span>
          </button>
          
          {/* Selector de Negocios */}
          {showBusinessSelector && (
            <div className="fixed bottom-20 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 min-w-[250px] max-w-sm">
              <div className="p-2 border-b border-gray-100 mb-2">
                <h3 className="font-semibold text-sm text-gray-700">Selecciona un negocio:</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {myBusinesses.map((business) => (
                  <Link
                    key={business.id}
                    href={`/${business.customSlug || business.slug}#services`}
                    className="flex items-center space-x-3 p-2 hover:bg-green-50 rounded-lg transition-colors"
                    onClick={() => setShowBusinessSelector(false)}
                  >
                    {(business.imageUrl || business.logo) && (
                      <img 
                        src={business.imageUrl || business.logo} 
                        alt={business.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{business.name}</p>
                      <p className="text-xs text-gray-500">{business.city}</p>
                    </div>
                    <ChevronRight className="text-gray-400" size={16} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
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

            {/* Quick Actions - Más prominente para agendar citas */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Sparkles className="mr-2 text-green-600" size={20} />
                Acciones Rápidas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Botón prominente para ver servicios */}
                {myBusinesses.length > 0 && (
                  <Link
                    href={`/${myBusinesses[0].customSlug || myBusinesses[0].slug}#services`}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                          <Calendar className="text-white" size={24} />
                        </div>
                        <div>
                          <span className="font-semibold block">Ver Servicios y Paquetes</span>
                          <span className="text-xs text-green-100">En {myBusinesses[0].name}</span>
                        </div>
                      </div>
                      <ChevronRight className="text-white" size={20} />
                    </div>
                  </Link>
                )}
                
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors w-full"
                >
                  <div className="flex items-center space-x-3">
                    <History className="text-blue-600" size={24} />
                    <span className="font-medium">Mis Citas</span>
                  </div>
                  <ChevronRight className="text-gray-400" size={20} />
                </button>

                <button
                  onClick={() => setActiveTab('packages')}
                  className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors w-full"
                >
                  <div className="flex items-center space-x-3">
                    <Package className="text-purple-600" size={24} />
                    <span className="font-medium">Mis Paquetes</span>
                  </div>
                  <ChevronRight className="text-gray-400" size={20} />
                </button>
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

            {/* Tus Servicios - Sección Unificada */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building2 className="mr-2 text-blue-600" size={20} />
                    Tus Servicios
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Accede rápidamente a tus negocios favoritos
                  </p>
                </div>
                <Calendar className="text-blue-500" size={24} />
              </div>
              
              {/* Negocios donde estás registrado */}
              {myBusinesses.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {myBusinesses.map((business) => (
                      <div
                        key={business.id}
                        className="bg-white rounded-lg p-4 hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-400 group relative"
                      >
                        {/* Botón de desregistro */}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setBusinessToUnregister(business)
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors z-10"
                          title="Desregistrarse del negocio"
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        <Link
                          href={`/${business.customSlug || business.slug}#services`}
                          className="block"
                        >
                          <div className="flex items-start space-x-3 mb-3">
                            {(business.imageUrl || business.logo) ? (
                              <img 
                                src={business.imageUrl || business.logo} 
                                alt={business.name}
                                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                                <Building2 className="text-blue-600" size={24} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 pr-8">
                              <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                                {business.name}
                              </h3>
                              <p className="text-xs text-gray-600">
                                {business.city}, {business.state}
                              </p>
                              {business.category && (
                                <span className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded mt-1">
                                  {business.category.name}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              <span>{business.serviceCount || 0} servicios</span>
                              {business.appointmentCount > 0 && (
                                <span className="text-blue-600 font-medium ml-2">
                                  • {business.appointmentCount} citas
                                </span>
                              )}
                            </div>
                            <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                              <Calendar className="mr-1" size={12} />
                              Agendar
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                  
                  {/* Botón para explorar más negocios */}
                  <div className="pt-4 border-t border-blue-100">
                    <div className="text-center mb-4">
                      <Link
                        href="/cliente/explore"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                      >
                        <Compass className="mr-2" size={18} />
                        Explorar Otros Negocios
                        <Sparkles className="ml-2" size={18} />
                      </Link>
                    </div>
                    
                    {/* Vista previa de negocios sugeridos */}
                    {suggestedBusinesses.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm text-gray-600 mb-3 text-center">Algunos negocios que podrían interesarte:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {suggestedBusinesses.slice(0, 3).map((business) => (
                            <Link
                              key={business.id}
                              href={`/${business.customSlug || business.slug}`}
                              className="bg-white/70 backdrop-blur rounded-lg p-3 hover:bg-white hover:shadow-md transition-all group border border-purple-100"
                            >
                              <div className="flex items-center space-x-2">
                                {(business.imageUrl || business.logo) ? (
                                  <img 
                                    src={business.imageUrl || business.logo} 
                                    alt={business.name}
                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="text-purple-600" size={16} />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                                    {business.name}
                                  </h4>
                                  {business.category && (
                                    <span className="text-xs text-purple-600">
                                      {business.category.name}
                                    </span>
                                  )}
                                </div>
                                <ChevronRight className="text-gray-400 group-hover:text-purple-600 transition-colors" size={16} />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Si no tiene negocios registrados */
                <div className="text-center py-8 bg-white rounded-lg">
                  <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aún no tienes servicios
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Explora y regístrate en los negocios que más te interesen para empezar a agendar citas.
                  </p>
                  <Link
                    href="/cliente/explore"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    <Compass className="mr-2" size={18} />
                    Explorar Negocios
                  </Link>
                </div>
              )}
            </div>
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
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {myBusinesses.length > 0 ? (
                    <Link
                      href={`/${myBusinesses[0].customSlug || myBusinesses[0].slug}`}
                      className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Package className="mr-2" size={18} />
                      Ver paquetes en {myBusinesses[0].name}
                    </Link>
                  ) : (
                    <Link
                      href="/cliente/explore"
                      className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Compass className="mr-2" size={18} />
                      Explorar Servicios
                    </Link>
                  )}
                </div>
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
              {myBusinesses.length > 0 && (() => {
                // Determinar qué negocio usar para el botón de nueva cita
                let businessForNewAppointment = myBusinesses[0]
                
                if (preferredBusinessId) {
                  const preferred = myBusinesses.find(
                    (b: any) => b.id === preferredBusinessId || 
                              b.slug === preferredBusinessId || 
                              b.customSlug === preferredBusinessId
                  )
                  if (preferred) {
                    businessForNewAppointment = preferred
                  }
                }
                
                return (
                  <Link
                    href={`/${businessForNewAppointment.customSlug || businessForNewAppointment.slug}#services`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    title={`Agendar cita en ${businessForNewAppointment.name}`}
                  >
                    <Plus className="mr-1" size={16} />
                    Nueva Cita
                  </Link>
                )
              })()}
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes citas programadas</h3>
                <p className="text-gray-500 mb-4">Reserva tu primera cita y comienza a disfrutar de nuestros servicios</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {myBusinesses.length > 0 ? (
                    <>
                      {(() => {
                        // Determinar qué negocio sugerir primero
                        let businessToSuggest = myBusinesses[0]
                        
                        if (preferredBusinessId) {
                          const preferred = myBusinesses.find(
                            (b: any) => b.id === preferredBusinessId || 
                                      b.slug === preferredBusinessId || 
                                      b.customSlug === preferredBusinessId
                          )
                          if (preferred) {
                            businessToSuggest = preferred
                          }
                        }
                        
                        return (
                          <Link
                            href={`/${businessToSuggest.customSlug || businessToSuggest.slug}#services`}
                            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Calendar className="mr-2" size={18} />
                            Ver servicios en {businessToSuggest.name}
                          </Link>
                        )
                      })()}
                      {myBusinesses.length > 1 && (
                        <button
                          onClick={() => setActiveTab('overview')}
                          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Building2 className="mr-2" size={18} />
                          Ver todos mis negocios
                        </button>
                      )}
                    </>
                  ) : (
                    <Link
                      href="/cliente/explore"
                      className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Compass className="mr-2" size={18} />
                      Explorar Servicios
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Separar citas por tiempo y agrupar por negocio */}
                {(() => {
                  const now = new Date()
                  const futureAppointments = appointments.filter(apt => new Date(apt.startTime) >= now)
                  const pastAppointments = appointments.filter(apt => new Date(apt.startTime) < now)
                  
                  // Agrupar por negocio
                  const groupByBusiness = (apts: Appointment[]) => {
                    const grouped: { [key: string]: Appointment[] } = {}
                    apts.forEach(apt => {
                      const businessName = apt.business.name
                      if (!grouped[businessName]) {
                        grouped[businessName] = []
                      }
                      grouped[businessName].push(apt)
                    })
                    return grouped
                  }
                  
                  const futureGrouped = groupByBusiness(futureAppointments)
                  const pastGrouped = groupByBusiness(pastAppointments)
                  
                  return (
                    <>
                      {/* Citas Futuras */}
                      {futureAppointments.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm mr-3">
                              Próximas
                            </span>
                            {futureAppointments.length} cita{futureAppointments.length !== 1 ? 's' : ''} programada{futureAppointments.length !== 1 ? 's' : ''}
                          </h3>
                          <div className="space-y-4">
                            {Object.entries(futureGrouped).map(([businessName, businessApts]) => (
                              <div key={businessName} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 border-b">
                                  <h4 className="font-medium text-gray-900 flex items-center">
                                    <Building2 className="mr-2 text-blue-600" size={18} />
                                    {businessName}
                                    <span className="ml-2 text-sm text-gray-500">
                                      ({businessApts.length} cita{businessApts.length !== 1 ? 's' : ''})
                                    </span>
                                  </h4>
                                </div>
                                <div className="divide-y">
                                  {businessApts.map((apt) => (
                                    <div key={apt.id} className="p-6 hover:bg-gray-50 transition-colors">
                                      <div className="flex justify-between items-start">
                                        <div className="flex space-x-4">
                                          <div className="p-3 bg-blue-100 rounded-lg">
                                            <Calendar className="text-blue-600" size={24} />
                                          </div>
                                          <div>
                                            <h3 className="font-semibold text-gray-900">{apt.service.name}</h3>
                                            <div className="mt-2 space-y-1">
                                              <p className="text-sm text-gray-600 flex items-center font-medium">
                                                <Clock className="mr-1 text-green-600" size={14} />
                                                {new Date(apt.startTime).toLocaleDateString('es-ES', { 
                                                  weekday: 'long', 
                                                  year: 'numeric', 
                                                  month: 'long', 
                                                  day: 'numeric' 
                                                })}
                                                {' a las '}
                                                {new Date(apt.startTime).toLocaleTimeString('es-ES', { 
                                                  hour: '2-digit', 
                                                  minute: '2-digit' 
                                                })}
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
                                        <div className="flex flex-col items-end gap-2">
                                          <span className={`px-3 py-1 text-sm rounded-full ${
                                            apt.status === 'CONFIRMED' 
                                              ? 'bg-green-100 text-green-700' 
                                              : apt.status === 'PENDING'
                                              ? 'bg-yellow-100 text-yellow-700'
                                              : 'bg-gray-100 text-gray-700'
                                          }`}>
                                            {apt.status === 'CONFIRMED' ? 'Confirmada' : 
                                             apt.status === 'PENDING' ? 'Pendiente' : apt.status}
                                          </span>
                                          <div className="flex flex-col gap-1.5">
                                            <Link
                                              href={`/${apt.business.customSlug || apt.business.slug}`}
                                              className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center gap-1.5"
                                            >
                                              <ExternalLink size={14} />
                                              Ver negocio
                                            </Link>
                                            {new Date(apt.startTime) > new Date() && apt.status === 'CONFIRMED' && (
                                              <button
                                                onClick={() => setAppointmentToCancel(apt)}
                                                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors flex items-center justify-center gap-1.5"
                                                title="Cancelar cita"
                                              >
                                                <XCircle size={14} />
                                                Cancelar
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Citas Pasadas */}
                      {pastAppointments.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm mr-3">
                              Historial
                            </span>
                            {pastAppointments.length} cita{pastAppointments.length !== 1 ? 's' : ''} pasada{pastAppointments.length !== 1 ? 's' : ''}
                          </h3>
                          <div className="space-y-4">
                            {Object.entries(pastGrouped).map(([businessName, businessApts]) => (
                              <div key={businessName} className="bg-white rounded-xl shadow-sm overflow-hidden opacity-75">
                                <div className="bg-gray-50 px-6 py-3 border-b">
                                  <h4 className="font-medium text-gray-700 flex items-center">
                                    <Building2 className="mr-2 text-gray-500" size={18} />
                                    {businessName}
                                    <span className="ml-2 text-sm text-gray-500">
                                      ({businessApts.length} cita{businessApts.length !== 1 ? 's' : ''})
                                    </span>
                                  </h4>
                                </div>
                                <div className="divide-y">
                                  {businessApts.map((apt) => (
                                    <div key={apt.id} className="p-6">
                                      <div className="flex justify-between items-start">
                                        <div className="flex space-x-4">
                                          <div className="p-3 bg-gray-100 rounded-lg">
                                            <History className="text-gray-500" size={24} />
                                          </div>
                                          <div>
                                            <h3 className="font-medium text-gray-700">{apt.service.name}</h3>
                                            <div className="mt-2 space-y-1">
                                              <p className="text-sm text-gray-500 flex items-center">
                                                <Clock className="mr-1" size={14} />
                                                {new Date(apt.startTime).toLocaleDateString('es-ES', { 
                                                  weekday: 'short', 
                                                  year: 'numeric', 
                                                  month: 'short', 
                                                  day: 'numeric' 
                                                })}
                                                {' - '}
                                                {new Date(apt.startTime).toLocaleTimeString('es-ES', { 
                                                  hour: '2-digit', 
                                                  minute: '2-digit' 
                                                })}
                                              </p>
                                              {apt.staff && (
                                                <p className="text-sm text-gray-500 flex items-center">
                                                  <User className="mr-1" size={14} />
                                                  Con {apt.staff.name}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <span className={`px-3 py-1 text-sm rounded-full ${
                                          apt.status === 'COMPLETED' 
                                            ? 'bg-gray-100 text-gray-600' 
                                            : apt.status === 'NO_SHOW'
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {apt.status === 'COMPLETED' ? 'Completada' : 
                                           apt.status === 'NO_SHOW' ? 'No asistió' : apt.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ProfileSection customer={customer} onProfileUpdate={(updatedCustomer) => setCustomer(updatedCustomer)} />
        )}
      </main>

      {/* Modal de confirmación para cancelar cita */}
      {appointmentToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 p-3 bg-amber-100 rounded-full">
                <AlertCircle className="text-amber-600" size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  ¿Cancelar esta cita?
                </h3>
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Servicio:</strong> {appointmentToCancel.service.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Fecha:</strong> {new Date(appointmentToCancel.startTime).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Hora:</strong> {new Date(appointmentToCancel.startTime).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Negocio:</strong> {appointmentToCancel.business.name}
                  </p>
                </div>
                
                {(() => {
                  const hoursUntil = (new Date(appointmentToCancel.startTime).getTime() - Date.now()) / (1000 * 60 * 60)
                  if (hoursUntil < 24) {
                    return (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800 font-medium">
                          ⚠️ Cancelación tardía
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          Faltan menos de 24 horas para tu cita. Considera contactar directamente al negocio si necesitas reprogramar.
                        </p>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setAppointmentToCancel(null)}
                disabled={isCancelling}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                No, mantener cita
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isCancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cancelando...
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="mr-2" />
                    Sí, cancelar cita
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para desregistro */}
      {businessToUnregister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 p-3 bg-red-100 rounded-full">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  ¿Desregistrarse de {businessToUnregister.name}?
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Esta acción eliminará tu registro de este negocio. Podrás volver a registrarte en el futuro si lo deseas.
                </p>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium">
                    ⚠️ Importante:
                  </p>
                  <ul className="text-sm text-amber-700 mt-1 space-y-1">
                    <li>• No podrás desregistrarte si tienes citas pendientes</li>
                    <li>• No podrás desregistrarte si tienes paquetes activos con sesiones disponibles</li>
                    <li>• Tu historial de citas pasadas se mantendrá para tu referencia</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setBusinessToUnregister(null)}
                disabled={isUnregistering}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUnregisterBusiness}
                disabled={isUnregistering}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isUnregistering ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} className="mr-2" />
                    Confirmar Desregistro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Add missing Check import at the top
const Check = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)




