'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Star, MapPin, Phone, Mail, Clock, Calendar, Users, Package, 
  ChevronLeft, X, Check, Eye, ChevronRight, Heart, Share2, 
  Instagram, Facebook, Twitter, Award, Shield, Sparkles,
  ArrowRight, User, DollarSign, Info, Image as ImageIcon, Gift,
  LogIn, LogOut, UserCircle
} from 'lucide-react'
import { getImageUrl, getImageSrcSet } from '@/lib/upload-utils-client'

interface BusinessLandingProps {
  business: any
}

export default function BusinessLandingEnhanced({ business }: BusinessLandingProps) {
  const router = useRouter()
  
  // Estados de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [customerData, setCustomerData] = useState<any>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginMode, setLoginMode] = useState<'login' | 'register' | 'verify'>('login')
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  })
  const [verificationCode, setVerificationCode] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  
  // Estados básicos
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingStep, setBookingStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0)
  const [bookingType, setBookingType] = useState<'service' | 'package' | 'use-package'>('service')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [servicesCategory, setServicesCategory] = useState<string>('all')
  const [servicesPage, setServicesPage] = useState(0)
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
    paymentMethod: 'CASH' // Default payment method
  })
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [lastBookingDetails, setLastBookingDetails] = useState<any>(null)
  const [customerPackages, setCustomerPackages] = useState<any[]>([]) // Paquetes activos del cliente
  const [selectedCustomerPackage, setSelectedCustomerPackage] = useState<any>(null) // Paquete seleccionado para usar
  const [usePackageSession, setUsePackageSession] = useState(false) // Si usar sesión del paquete
  const [isLoadingPackages, setIsLoadingPackages] = useState(false)
  const [hasSearchedPackages, setHasSearchedPackages] = useState(false)
  const [myAppointments, setMyAppointments] = useState<any[]>([]) // Citas del cliente logueado
  
  // Datos del negocio
  const reviews = business.reviews || []
  const galleryItems = business.galleryItems || []
  const staff = business.staff || []
  const workingHours = business.workingHours || []
  
  // Colores del tema
  const colors = {
    primary: business.settings?.theme?.primaryColor || '#6366F1',
    accent: business.settings?.theme?.accentColor || '#F59E0B',
    gradient: `linear-gradient(135deg, ${business.settings?.theme?.primaryColor || '#6366F1'} 0%, ${business.settings?.theme?.accentColor || '#F59E0B'} 100%)`
  }

  // Días de la semana
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    const storedCustomerData = localStorage.getItem('clientData')
    if (token && storedCustomerData) {
      try {
        const customer = JSON.parse(storedCustomerData)
        setIsAuthenticated(true)
        setCustomerData(customer)
        // Auto-fill booking data
        setBookingData(prev => ({
          ...prev,
          customerName: customer.name || '',
          customerEmail: customer.email || '',
          customerPhone: customer.phone || ''
        }))
        // Load customer packages and appointments
        loadCustomerData(token)
      } catch (error) {
        console.error('Error loading customer data:', error)
      }
    }
  }, [])

  // Load customer packages and appointments
  const loadCustomerData = async (token: string) => {
    try {
      // Load packages
      const packagesResponse = await fetch('/api/cliente/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (packagesResponse.ok) {
        const data = await packagesResponse.json()
        setCustomerPackages(data.packages || [])
        setMyAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Error loading customer data:', error)
    }
  }

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    try {
      if (loginMode === 'register' && !verificationSent) {
        // Send verification code
        const response = await fetch('/api/cliente/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginForm)
        })

        const data = await response.json()

        if (!response.ok) {
          setLoginError(data.error || 'Error al enviar código')
          return
        }

        // Show verification code input
        setVerificationSent(true)
        setLoginMode('verify')
        setLoginError('')
        
        // In development, show the code
        if (data.devCode) {
          alert(`Código de verificación (solo desarrollo): ${data.devCode}`)
        }
        
      } else if (loginMode === 'verify') {
        // Verify code
        const response = await fetch('/api/cliente/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginForm.email,
            code: verificationCode
          })
        })

        const data = await response.json()

        if (!response.ok) {
          setLoginError(data.error || 'Código inválido')
          return
        }

        // Success - save and continue
        localStorage.setItem('clientToken', data.token)
        localStorage.setItem('clientData', JSON.stringify(data.customer))
        
        setIsAuthenticated(true)
        setCustomerData(data.customer)
        setShowLoginModal(false)
        
        setBookingData(prev => ({
          ...prev,
          customerName: data.customer.name || '',
          customerEmail: data.customer.email || '',
          customerPhone: data.customer.phone || ''
        }))
        
        setCustomerPackages(data.packages || [])
        setMyAppointments(data.appointments || [])
        
      } else {
        // Normal login
        const response = await fetch('/api/cliente/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginForm)
        })

        const data = await response.json()

        if (!response.ok) {
          setLoginError(data.error || 'Error al iniciar sesión')
          return
        }

        localStorage.setItem('clientToken', data.token)
        localStorage.setItem('clientData', JSON.stringify(data.customer))
        
        setIsAuthenticated(true)
        setCustomerData(data.customer)
        setShowLoginModal(false)
        
        setBookingData(prev => ({
          ...prev,
          customerName: data.customer.name || '',
          customerEmail: data.customer.email || '',
          customerPhone: data.customer.phone || ''
        }))
        
        setCustomerPackages(data.packages || [])
        setMyAppointments(data.appointments || [])
      }
      
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('Error de conexión')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('clientToken')
    localStorage.removeItem('clientData')
    setIsAuthenticated(false)
    setCustomerData(null)
    setCustomerPackages([])
    setMyAppointments([])
    setBookingData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      notes: '',
      paymentMethod: 'CASH'
    })
  }

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return
    
    const token = localStorage.getItem('clientToken')
    if (!token) {
      alert('Debes iniciar sesión para cancelar citas')
      return
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('Cita cancelada exitosamente')
        // Reload appointments
        await loadCustomerData(token)
      } else {
        const error = await response.json()
        alert(error.message || 'Error al cancelar la cita')
      }
    } catch (error) {
      console.error('Error canceling appointment:', error)
      alert('Error al cancelar la cita')
    }
  }

  // Auto-rotar galería
  useEffect(() => {
    if (galleryItems.length > 1) {
      const interval = setInterval(() => {
        setActiveGalleryIndex((prev) => (prev + 1) % galleryItems.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [galleryItems.length])

  // Fetch available slots
  const fetchAvailableSlots = async () => {
    if (!selectedDate || (!selectedService && !selectedPackage)) return
    
    setIsLoadingSlots(true)
    try {
      const params = new URLSearchParams({
        businessId: business.id,
        serviceId: selectedService?.id || selectedPackage?.services[0]?.service?.id,
        date: selectedDate
      })
      if (selectedStaff) {
        params.append('staffId', selectedStaff.id)
      }
      
      const response = await fetch(`/api/public/appointments?${params}`)
      const data = await response.json()
      setAvailableSlots(data.availableSlots || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      setAvailableSlots([])
    } finally {
      setIsLoadingSlots(false)
    }
  }

  // Buscar paquetes activos del cliente cuando ingresa su email
  const fetchCustomerPackages = async () => {
    // Si el usuario está autenticado, ya tenemos sus paquetes
    if (isAuthenticated) {
      setHasSearchedPackages(true)
      return
    }
    
    // Validar formato de email más estricto
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!bookingData.customerEmail || !emailRegex.test(bookingData.customerEmail)) return
    
    setIsLoadingPackages(true)
    try {
      const response = await fetch(`/api/public/customer/packages?email=${encodeURIComponent(bookingData.customerEmail)}&businessId=${business.id}`)
      if (response.ok) {
        const data = await response.json()
        setCustomerPackages(data.packages || [])
        setHasSearchedPackages(true)
        // Si tiene paquetes y estamos reservando un servicio, preseleccionar el uso del paquete
        if (data.packages && data.packages.length > 0 && bookingType === 'service') {
          // Buscar un paquete que incluya el servicio seleccionado
          const applicablePackage = data.packages.find((pkg: any) => 
            pkg.package.services.some((ps: any) => ps.serviceId === selectedService?.id) &&
            pkg.remainingSessions > 0
          )
          if (applicablePackage) {
            setSelectedCustomerPackage(applicablePackage)
            setUsePackageSession(true)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching customer packages:', error)
    } finally {
      setIsLoadingPackages(false)
    }
  }

  useEffect(() => {
    if (selectedDate && (selectedService || selectedPackage)) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedService, selectedPackage, selectedStaff])

  // No buscar automáticamente - solo cuando el usuario lo solicite
  // Este useEffect se puede eliminar ya que ahora usamos onBlur y onKeyPress

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let response;
      
      if (bookingType === 'package') {
        // For package purchases, use the package purchase endpoint
        response = await fetch('/api/public/packages/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: business.id,
            packageId: selectedPackage?.id,
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone,
            paymentMethod: bookingData.paymentMethod,
            notes: bookingData.notes
          })
        })
      } else {
        // For service appointments, use the appointments endpoint
        response = await fetch('/api/public/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: business.id,
            serviceId: selectedService?.id,
            packagePurchaseId: usePackageSession ? selectedCustomerPackage?.id : undefined,
            usePackageSession: usePackageSession,
            staffId: selectedStaff?.id,
            date: selectedDate,
            time: selectedTime,
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone,
            notes: bookingData.notes
          })
        })
      }

      if (response.ok) {
        const result = await response.json()
        setLastBookingDetails({
          service: selectedService?.name || selectedPackage?.name,
          date: selectedDate,
          time: selectedTime,
          staff: selectedStaff?.name || 'Por asignar',
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          usedPackage: usePackageSession,
          packageName: selectedCustomerPackage?.package?.name,
          remainingSessions: result.appointment?.remainingSessions
        })
        setBookingSuccess(true)
        setBookingStep(4) // Nuevo paso para mostrar éxito
      } else {
        const error = await response.json()
        alert(error.error || 'Error al crear la reserva')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Ocurrió un error. Por favor intenta nuevamente.')
    }
  }

  const resetBookingForm = () => {
    setBookingStep(1)
    setBookingType('service')
    setSelectedService(null)
    setSelectedPackage(null)
    setSelectedDate('')
    setSelectedTime('')
    setSelectedStaff(null)
    setBookingData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      notes: '',
      paymentMethod: 'CASH'
    })
    setBookingSuccess(false)
    setLastBookingDetails(null)
    setCustomerPackages([])
    setSelectedCustomerPackage(null)
    setUsePackageSession(false)
    setIsLoadingPackages(false)
    setHasSearchedPackages(false)
  }

  // Calcular rating promedio
  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length 
    : 5

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header flotante mejorado */}
      <header className="fixed top-0 w-full backdrop-blur-xl bg-white/70 border-b border-gray-100 z-50 shadow-sm">
        <nav className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {business.logo && (
                <img 
                  src={getImageUrl(business.logo, 'business', 128)} 
                  alt={business.name} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                  {business.name}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">{business.category || 'Servicios Profesionales'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* User menu */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                    <UserCircle className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{customerData?.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <LogIn className="w-5 h-5 text-gray-600" />
                  <span className="hidden sm:inline text-sm font-medium">Iniciar Sesión</span>
                </button>
              )}
              
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Heart className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-4 sm:px-6 py-2.5 rounded-full font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: colors.gradient }}
              >
                <span className="hidden sm:inline">Reservar Cita</span>
                <span className="sm:hidden">Reservar</span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section con galería mejorada */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background con galería */}
        {galleryItems.length > 0 && (
          <div className="absolute inset-0">
            <div className="relative h-full">
              {galleryItems.map((item: any, index: number) => (
                <div
                  key={item.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === activeGalleryIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={getImageUrl(item.id || item.url, 'gallery', 1200)}
                    srcSet={getImageSrcSet(item.id || item.url, 'gallery')}
                    sizes="100vw"
                    alt={item.title || 'Gallery'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenido del hero */}
        <div className="relative container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm">Negocio Verificado</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-4">
              {business.name}
            </h1>
            
            <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              {business.description || 'Servicios profesionales de la más alta calidad'}
            </p>

            {/* Stats mejorados */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <Users className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">
                  {business.stats?.completedAppointments || 0}+ clientes
                </span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-white font-semibold">
                  {averageRating.toFixed(1)} ({reviews.length} reseñas)
                </span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <Award className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">
                  Top Professional
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
              >
                Reservar Ahora
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                href="/cliente/dashboard"
                className="px-6 py-4 bg-white/20 backdrop-blur-sm text-white border-2 border-white/50 rounded-full font-bold hover:bg-white/30 transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                Mi Portal
              </Link>
              
              <a
                href="#services"
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-full font-bold hover:bg-white/20 transition-all duration-300"
              >
                Ver Servicios
              </a>
            </div>
          </div>

          {/* Indicadores de galería */}
          {galleryItems.length > 1 && (
            <div className="flex gap-2 mt-8">
              {galleryItems.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setActiveGalleryIndex(index)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === activeGalleryIndex 
                      ? 'w-8 bg-white' 
                      : 'w-4 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-white border-y">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" style={{ color: colors.primary }} />
              <div>
                <p className="text-xs text-gray-500">Horario Hoy</p>
                <p className="font-semibold">
                  {(() => {
                    const today = new Date().getDay()
                    const todayHours = workingHours.find((wh: any) => 
                      wh.dayOfWeek === today && !wh.staffId
                    )
                    return todayHours && todayHours.isActive 
                      ? `${todayHours.startTime} - ${todayHours.endTime}`
                      : 'Cerrado'
                  })()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
              <div>
                <p className="text-xs text-gray-500">Ubicación</p>
                <p className="font-semibold">{business.city || 'Ciudad'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" style={{ color: colors.primary }} />
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="font-semibold">{business.phone || 'Contactar'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5" style={{ color: colors.primary }} />
              <div>
                <p className="text-xs text-gray-500">Desde</p>
                <p className="font-semibold">
                  ${Math.min(...(business.services?.map((s: any) => s.price) || [0]))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section mejorada */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
              Servicios
            </span>
            <h2 className="text-4xl font-black mt-2 mb-4">
              Lo Que Ofrecemos
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Servicios profesionales adaptados a tus necesidades
            </p>
          </div>

          {/* Filtros de categoría */}
          {(() => {
            const categories = Array.from(new Set(
              business.services?.map((s: any) => s.category).filter(Boolean)
            )) as string[]
            
            if (categories.length > 1) {
              return (
                <div className="flex justify-center mb-8">
                  <div className="inline-flex flex-wrap gap-2 p-1 bg-gray-100 rounded-full">
                    <button
                      onClick={() => {
                        setServicesCategory('all')
                        setServicesPage(0)
                      }}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                        servicesCategory === 'all'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Todos
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setServicesCategory(category)
                          setServicesPage(0)
                        }}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                          servicesCategory === category
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Grid de servicios con paginación */}
          {(() => {
            // Filtrar servicios por categoría
            const filteredServices = servicesCategory === 'all'
              ? business.services
              : business.services?.filter((s: any) => s.category === servicesCategory)
            
            // Configuración de paginación
            const servicesPerPage = 6
            const totalPages = Math.ceil((filteredServices?.length || 0) / servicesPerPage)
            const startIndex = servicesPage * servicesPerPage
            const endIndex = startIndex + servicesPerPage
            const currentServices = filteredServices?.slice(startIndex, endIndex) || []
            
            return (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentServices.map((service: any) => (
                    <div 
                      key={service.id} 
                      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                      {service.image && (
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={service.image} 
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold">{service.name}</h3>
                          {service.category && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              {service.category}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {service.description || 'Servicio profesional de calidad'}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{service.duration} min</span>
                          </div>
                          <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                            ${service.price}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedService(service)
                            setBookingType('service')
                            setShowBookingModal(true)
                          }}
                          className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                          style={{ background: colors.gradient }}
                        >
                          Reservar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Controles de paginación */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-10">
                    <button
                      onClick={() => setServicesPage(Math.max(0, servicesPage - 1))}
                      disabled={servicesPage === 0}
                      className={`p-2 rounded-full transition-all ${
                        servicesPage === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setServicesPage(i)}
                          className={`w-10 h-10 rounded-full font-medium transition-all ${
                            i === servicesPage
                              ? 'text-white shadow-lg transform scale-110'
                              : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                          }`}
                          style={{
                            background: i === servicesPage ? colors.gradient : undefined
                          }}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setServicesPage(Math.min(totalPages - 1, servicesPage + 1))}
                      disabled={servicesPage === totalPages - 1}
                      className={`p-2 rounded-full transition-all ${
                        servicesPage === totalPages - 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
                
                {/* Indicador de servicios */}
                {filteredServices?.length > servicesPerPage && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, filteredServices.length)} de {filteredServices.length} servicios
                  </p>
                )}
              </>
            )
          })()}
        </div>
      </section>

      {/* My Packages & Appointments Section for Authenticated Users */}
      {isAuthenticated && (customerPackages.length > 0 || myAppointments.length > 0) && (
        <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Mi Cuenta</h2>
              <p className="text-gray-600">Gestiona tus paquetes y citas</p>
            </div>

            {/* Active Packages */}
            {customerPackages.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" style={{ color: colors.primary }} />
                  Mis Paquetes Activos
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customerPackages.map((purchasedPkg: any) => (
                    <div 
                      key={purchasedPkg.id}
                      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-lg">{purchasedPkg.package.name}</h4>
                        {purchasedPkg.remainingSessions > 0 && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {purchasedPkg.remainingSessions} sesiones
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 mb-4">
                        {purchasedPkg.package.services.map((ps: any) => (
                          <p key={ps.service.id} className="text-sm text-gray-600">
                            • {ps.service.name} ({ps.quantity}x)
                          </p>
                        ))}
                      </div>
                      {purchasedPkg.expiryDate && (
                        <p className="text-xs text-gray-500">
                          Vence: {new Date(purchasedPkg.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCustomerPackage(purchasedPkg)
                          setBookingType('use-package')
                          setShowBookingModal(true)
                        }}
                        disabled={purchasedPkg.remainingSessions === 0}
                        className="mt-4 w-full py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          background: purchasedPkg.remainingSessions > 0 ? colors.gradient : '#e5e7eb',
                          color: purchasedPkg.remainingSessions > 0 ? 'white' : '#9ca3af'
                        }}
                      >
                        {purchasedPkg.remainingSessions > 0 ? 'Usar Paquete' : 'Sin sesiones'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Appointments */}
            {myAppointments.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
                  Mis Próximas Citas
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myAppointments
                    .filter((apt: any) => new Date(apt.startTime) >= new Date())
                    .slice(0, 6)
                    .map((appointment: any) => (
                      <div 
                        key={appointment.id}
                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold">{appointment.service.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                            appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {appointment.status === 'CONFIRMED' ? 'Confirmada' : 
                             appointment.status === 'PENDING' ? 'Pendiente' : appointment.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(appointment.startTime).toLocaleDateString()}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {appointment.staff && (
                            <p className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {appointment.staff.name}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="mt-4 w-full py-2 rounded-lg font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all"
                        >
                          Cancelar Cita
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Packages Section mejorada */}
      {business.packages?.length > 0 && (
        <section id="packages" className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                Ofertas Especiales
              </span>
              <h2 className="text-4xl font-black mt-2 mb-4">
                Paquetes y Promociones
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Ahorra con nuestros paquetes especialmente diseñados
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {business.packages.map((pkg: any) => (
                <div 
                  key={pkg.id} 
                  className="relative group bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  {pkg.discount && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{pkg.discount}%
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-8 h-8" style={{ color: colors.primary }} />
                      <div>
                        <h3 className="text-xl font-bold">{pkg.name}</h3>
                        {pkg.sessionCount && (
                          <span className="text-sm text-gray-500">
                            {pkg.sessionCount} sesiones incluidas
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6">
                      {pkg.description || 'Paquete especial con descuento'}
                    </p>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold" style={{ color: colors.primary }}>
                          ${pkg.price}
                        </span>
                        {pkg.originalPrice && (
                          <span className="text-lg text-gray-400 line-through">
                            ${pkg.originalPrice}
                          </span>
                        )}
                      </div>
                      {pkg.validityDays && (
                        <p className="text-sm text-gray-500 mt-1">
                          Válido por {pkg.validityDays} días
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6">
                      {pkg.services?.map((ps: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">
                            {ps.quantity}x {ps.service.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => {
                        setSelectedPackage(pkg)
                        setBookingType('package')
                        setBookingStep(3) // Jump directly to customer info for packages
                        setShowBookingModal(true)
                      }}
                      className="w-full py-3 rounded-xl font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300"
                    >
                      Comprar Paquete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Staff Section */}
      {staff.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                Equipo
              </span>
              <h2 className="text-4xl font-black mt-2 mb-4">
                Nuestros Profesionales
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {staff.map((member: any) => (
                <div key={member.id} className="text-center group">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200">
                      {member.photo ? (
                        <img 
                          src={getImageUrl(member.photo, 'avatar', 256)}
                          srcSet={getImageSrcSet(member.photo, 'avatar')}
                          sizes="128px"
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {member.rating && (
                      <div className="absolute bottom-0 right-1/2 translate-x-1/2 bg-white rounded-full px-3 py-1 shadow-lg flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold">{member.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  {member.specialties && (
                    <p className="text-sm text-gray-500 mt-1">{member.specialties}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section mejorada */}
      {reviews.length > 0 && (
        <section id="reviews" className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                Testimonios
              </span>
              <h2 className="text-4xl font-black mt-2 mb-4">
                Lo Que Dicen Nuestros Clientes
              </h2>
              
              {/* Rating summary */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <div className="text-5xl font-bold" style={{ color: colors.primary }}>
                  {averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-6 h-6"
                        fill={i < Math.round(averageRating) ? colors.accent : 'none'}
                        color={colors.accent}
                      />
                    ))}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    Basado en {reviews.length} reseñas
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map((review: any) => (
                <div 
                  key={review.id} 
                  className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4"
                          fill={i < review.rating ? colors.accent : 'none'}
                          color={colors.accent}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-4 italic">"{review.comment}"</p>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-sm font-bold">
                      {review.customer?.name?.charAt(0) || 'C'}
                    </div>
                    <p className="font-semibold text-sm">
                      {review.customer?.name || 'Cliente'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section mejorada */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Información de Contacto</h2>
              
              <div className="space-y-6 mb-8">
                {business.address && (
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: colors.accent }} />
                    <div>
                      <p className="font-semibold mb-1">Dirección</p>
                      <p className="text-gray-300">
                        {business.address}, {business.city}, {business.state}
                      </p>
                    </div>
                  </div>
                )}
                
                {business.phone && (
                  <div className="flex items-start gap-4">
                    <Phone className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: colors.accent }} />
                    <div>
                      <p className="font-semibold mb-1">Teléfono</p>
                      <p className="text-gray-300">{business.phone}</p>
                    </div>
                  </div>
                )}
                
                {business.email && (
                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: colors.accent }} />
                    <div>
                      <p className="font-semibold mb-1">Email</p>
                      <p className="text-gray-300">{business.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Social media */}
              <div>
                <p className="font-semibold mb-4">Síguenos</p>
                <div className="flex gap-4">
                  <a href="#" className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Horario de Atención</h2>
              
              <div className="space-y-3">
                {[0, 1, 2, 3, 4, 5, 6].map(day => {
                  const dayHours = workingHours.find((wh: any) => 
                    wh.dayOfWeek === day && !wh.staffId
                  )
                  const isToday = new Date().getDay() === day
                  
                  return (
                    <div 
                      key={day} 
                      className={`flex justify-between py-3 px-4 rounded-lg ${
                        isToday ? 'bg-white/10' : ''
                      }`}
                    >
                      <span className={`font-medium ${isToday ? 'text-white' : 'text-gray-400'}`}>
                        {daysOfWeek[day]}
                      </span>
                      <span className={isToday ? 'text-white' : 'text-gray-400'}>
                        {dayHours && dayHours.isActive
                          ? `${dayHours.startTime} - ${dayHours.endTime}`
                          : 'Cerrado'}
                      </span>
                    </div>
                  )
                })}
              </div>
              
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full mt-8 py-4 rounded-xl font-bold text-gray-900 bg-white hover:bg-gray-100 transition-all duration-300"
              >
                Reservar Cita Ahora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8 text-center text-gray-400">
        <p>&copy; 2024 {business.name}. Todos los derechos reservados.</p>
      </footer>

      {/* Booking Modal Mejorado */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header del modal */}
            <div className="sticky top-0 bg-white border-b p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    {bookingStep === 4 ? 'Confirmación' : (bookingType === 'package' ? 'Comprar Paquete' : 'Reservar Cita')}
                  </h2>
                  {bookingStep !== 4 && (
                    <p className="text-sm text-gray-500 mt-1">Paso {bookingStep} de 3</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowBookingModal(false)
                    resetBookingForm()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="flex gap-2 mt-4">
                <div className={`h-1 flex-1 rounded-full transition-colors ${
                  bookingStep >= 1 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'
                }`} />
                <div className={`h-1 flex-1 rounded-full transition-colors ${
                  bookingStep >= 2 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'
                }`} />
                <div className={`h-1 flex-1 rounded-full transition-colors ${
                  bookingStep >= 3 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'
                }`} />
                {bookingStep === 4 && (
                  <div className="h-1 flex-1 rounded-full bg-green-500" />
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Step 1: Seleccionar tipo y servicio/paquete */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  {/* Selector de tipo */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      ¿Qué deseas hacer?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => setBookingType('service')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          bookingType === 'service'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Calendar className="w-6 h-6 mx-auto mb-2" 
                          color={bookingType === 'service' ? '#3B82F6' : '#9CA3AF'} />
                        <p className="font-semibold">Reservar Servicio</p>
                        <p className="text-xs text-gray-500 mt-1">Pagar al asistir</p>
                      </button>
                      
                      <button
                        onClick={() => {
                          setBookingType('use-package')
                          // Solicitar email inmediatamente
                          if (!bookingData.customerEmail) {
                            setBookingStep(1.5) // Paso intermedio para pedir email
                          }
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          bookingType === 'use-package'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Gift className="w-6 h-6 mx-auto mb-2" 
                          color={bookingType === 'use-package' ? '#10B981' : '#9CA3AF'} />
                        <p className="font-semibold">Usar Mi Paquete</p>
                        <p className="text-xs text-gray-500 mt-1">Tengo sesiones</p>
                      </button>
                      
                      <button
                        onClick={() => setBookingType('package')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          bookingType === 'package'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Package className="w-6 h-6 mx-auto mb-2" 
                          color={bookingType === 'package' ? '#8B5CF6' : '#9CA3AF'} />
                        <p className="font-semibold">Comprar Paquete</p>
                        <p className="text-xs text-gray-500 mt-1">Ofertas especiales</p>
                      </button>
                    </div>
                  </div>

                  {/* Lista de servicios o paquetes normal */}
                  {bookingType !== 'use-package' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      {bookingType === 'package' ? 'Selecciona un paquete' : 'Selecciona un servicio'}
                    </label>
                    
                    {/* Filtros de categorías - Solo para servicios */}
                    {bookingType === 'service' && (() => {
                      // Obtener categorías únicas de los servicios
                      const categories = Array.from(new Set(
                        business.services?.map((s: any) => s.category).filter(Boolean)
                      )) as string[]
                      
                      // Solo mostrar filtros si hay más de una categoría
                      if (categories.length > 1) {
                        return (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                  selectedCategory === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                Todos
                              </button>
                              {categories.map((category) => (
                                <button
                                  key={category}
                                  onClick={() => setSelectedCategory(category)}
                                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    selectedCategory === category
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {category}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {bookingType === 'service' ? (
                        (() => {
                          // Filtrar servicios por categoría seleccionada
                          const filteredServices = selectedCategory === 'all'
                            ? business.services
                            : business.services?.filter((s: any) => s.category === selectedCategory)
                          
                          // Agrupar servicios por categoría si no hay filtro aplicado
                          if (selectedCategory === 'all' && business.services?.length > 10) {
                            const groupedServices: { [key: string]: any[] } = {}
                            business.services?.forEach((service: any) => {
                              const category = service.category || 'Sin categoría'
                              if (!groupedServices[category]) {
                                groupedServices[category] = []
                              }
                              groupedServices[category].push(service)
                            })
                            
                            return Object.entries(groupedServices).map(([category, services]) => (
                              <div key={category} className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-600 mb-2 px-2">
                                  {category}
                                </h4>
                                {services.map((service: any) => (
                                  <button
                                    key={service.id}
                                    onClick={() => {
                                      setSelectedService(service)
                                      setBookingStep(2)
                                    }}
                                    className={`w-full text-left p-4 rounded-xl transition-all mb-2 ${
                                      selectedService?.id === service.id
                                        ? 'bg-blue-50 border-2 border-blue-500'
                                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-semibold">{service.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                          {service.duration} minutos
                                        </p>
                                      </div>
                                      <p className="font-bold text-lg">${service.price}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ))
                          } else {
                            // Mostrar servicios sin agrupar
                            return filteredServices?.map((service: any) => (
                              <button
                                key={service.id}
                                onClick={() => {
                                  setSelectedService(service)
                                  setBookingStep(2)
                                }}
                                className={`w-full text-left p-4 rounded-xl transition-all ${
                                  selectedService?.id === service.id
                                    ? 'bg-blue-50 border-2 border-blue-500'
                                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">{service.name}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {service.duration} minutos
                                    </p>
                                  </div>
                                  <p className="font-bold text-lg">${service.price}</p>
                                </div>
                              </button>
                            ))
                          }
                        })()
                      ) : (
                        business.packages?.map((pkg: any) => (
                          <button
                            key={pkg.id}
                            onClick={() => {
                              setSelectedPackage(pkg)
                              setBookingStep(3) // Skip to customer info for packages
                            }}
                            className={`w-full text-left p-4 rounded-xl transition-all ${
                              selectedPackage?.id === pkg.id
                                ? 'bg-purple-50 border-2 border-purple-500'
                                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{pkg.name}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {pkg.sessionCount} sesiones • Válido {pkg.validityDays} días
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">${pkg.price}</p>
                                {pkg.originalPrice && (
                                  <p className="text-sm text-gray-400 line-through">
                                    ${pkg.originalPrice}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  )}
                </div>
              )}

              {/* Step 1.5: Seleccionar paquete para usar */}
              {bookingStep === 1.5 && bookingType === 'use-package' && (
                <div className="space-y-6">
                  <button
                    onClick={() => {
                      setBookingStep(1)
                      setBookingType('service')
                      setSelectedCustomerPackage(null)
                      setCustomerPackages([])
                    }}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft size={20} className="mr-1" />
                    Volver
                  </button>
                  
                  {/* Solicitar email si no lo tiene */}
                  {!bookingData.customerEmail && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <p className="font-semibold text-green-800 mb-3">
                        Ingresa tu email para ver tus paquetes disponibles
                      </p>
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        value={bookingData.customerEmail}
                        onChange={(e) => {
                          setBookingData({...bookingData, customerEmail: e.target.value})
                          setHasSearchedPackages(false) // Reset search status when email changes
                        }}
                        onBlur={() => {
                          // Buscar cuando el usuario termine de escribir
                          fetchCustomerPackages()
                        }}
                        onKeyPress={(e) => {
                          // Buscar cuando presione Enter
                          if (e.key === 'Enter') {
                            fetchCustomerPackages()
                          }
                        }}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:border-green-500 transition-colors"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Ingresa tu email completo y presiona Enter o haz clic fuera del campo
                      </p>
                    </div>
                  )}
                  
                  {/* Mostrar estado de carga */}
                  {bookingData.customerEmail && isLoadingPackages && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <p className="text-gray-600 mt-2">Buscando tus paquetes...</p>
                    </div>
                  )}
                  
                  {/* Mostrar paquetes disponibles si ya ingresó email */}
                  {bookingData.customerEmail && !isLoadingPackages && customerPackages.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Tus paquetes disponibles
                      </label>
                      <div className="space-y-3">
                        {customerPackages.map((pkg) => (
                          <div 
                            key={pkg.id}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedCustomerPackage?.id === pkg.id 
                                ? 'border-green-500 bg-green-50' 
                                : 'border-gray-200 hover:border-green-300'
                            }`}
                            onClick={() => {
                              setSelectedCustomerPackage(pkg)
                              setUsePackageSession(true)
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{pkg.package.name}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {pkg.remainingSessions} sesiones disponibles
                                </p>
                                {pkg.expiryDate && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Válido hasta: {new Date(pkg.expiryDate).toLocaleDateString()}
                                  </p>
                                )}
                                <div className="mt-2">
                                  <p className="text-xs text-gray-600">Incluye:</p>
                                  {pkg.package.services.map((ps: any) => (
                                    <p key={ps.serviceId} className="text-xs text-gray-500">
                                      • {ps.service.name} ({ps.quantity} sesiones)
                                    </p>
                                  ))}
                                </div>
                              </div>
                              {selectedCustomerPackage?.id === pkg.id && (
                                <Check className="text-green-600" size={24} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {selectedCustomerPackage && (
                        <button
                          onClick={() => {
                            // Preseleccionar el primer servicio del paquete
                            const firstService = selectedCustomerPackage.package.services[0]?.service
                            if (firstService) {
                              setSelectedService(firstService)
                              setBookingStep(2)
                            }
                          }}
                          className="w-full mt-4 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                          style={{ background: colors.gradient }}
                        >
                          Continuar y elegir horario
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Mensaje si no tiene paquetes - solo mostrar después de buscar */}
                  {bookingData.customerEmail && !isLoadingPackages && hasSearchedPackages && customerPackages.length === 0 && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                      <p className="text-yellow-800 font-semibold mb-2">
                        No encontramos paquetes activos
                      </p>
                      <p className="text-sm text-yellow-700 mb-3">
                        No tienes paquetes disponibles con este email
                      </p>
                      <button
                        onClick={() => {
                          setBookingType('package')
                          setBookingStep(1)
                        }}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        ¿Quieres comprar un paquete?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Fecha y hora (para servicios y use-package) */}
              {bookingStep === 2 && (bookingType === 'service' || bookingType === 'use-package') && (
                <div className="space-y-6">
                  <button
                    onClick={() => setBookingStep(bookingType === 'use-package' ? 1.5 : 1)}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft size={20} className="mr-1" />
                    Volver
                  </button>

                  {/* Staff Selection */}
                  {(() => {
                    // Debug: Ver qué contiene el servicio seleccionado
                    console.log('Selected Service:', selectedService)
                    console.log('Service Staff:', selectedService?.serviceStaff)
                    
                    // Filtrar trabajadores basándose en el servicio seleccionado
                    const availableStaff = staff.filter((s: any) => {
                      // Si el servicio tiene serviceStaff, solo mostrar esos trabajadores
                      if (selectedService?.serviceStaff && selectedService.serviceStaff.length > 0) {
                        return selectedService.serviceStaff.some((ss: any) => ss.staffId === s.id)
                      }
                      // Si no hay serviceStaff, mostrar todos los trabajadores activos
                      return s.isActive !== false
                    })
                    
                    // Solo mostrar la sección si hay trabajadores disponibles
                    if (availableStaff.length === 0 && selectedService?.serviceStaff?.length > 0) {
                      // Si el servicio tiene asignados pero ninguno está en la lista de staff
                      return null
                    }
                    
                    return (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-3 block">
                          Profesional {availableStaff.length > 0 ? '(opcional)' : ''}
                        </label>
                        
                        {/* Opción visual con fotos */}
                        <div className="space-y-2">
                          {/* Opción "Cualquier disponible" - solo mostrar si hay trabajadores */}
                          {availableStaff.length > 0 && (
                            <div
                              onClick={() => setSelectedStaff(null)}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-300 ${
                                !selectedStaff ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                            >
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <Users size={20} className="text-gray-500" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">Cualquier disponible</p>
                                <p className="text-sm text-gray-500">Se asignará automáticamente</p>
                              </div>
                              {!selectedStaff && (
                                <Check size={20} className="text-blue-500" />
                              )}
                            </div>
                          )}
                          
                          {/* Lista de trabajadores con fotos - ya filtrados */}
                          {availableStaff.map((s: any) => (
                          <div
                            key={s.id}
                            onClick={() => setSelectedStaff(s)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-300 ${
                              selectedStaff?.id === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                          >
                            {/* Foto del trabajador */}
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                              {s.photo ? (
                                <img
                                  src={getImageUrl(s.photo, 'avatar', 128)}
                                  alt={s.name}
                                  className="w-full h-full object-cover object-center"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User size={20} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Información del trabajador */}
                            <div className="flex-1">
                              <p className="font-medium">{s.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                {s.specialties && s.specialties.length > 0 && (
                                  <span>{s.specialties[0]}</span>
                                )}
                                {s.rating && (
                                  <span className="flex items-center gap-1">
                                    <Star size={12} className="text-yellow-500 fill-current" />
                                    {s.rating}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Check mark si está seleccionado */}
                            {selectedStaff?.id === s.id && (
                              <Check size={20} className="text-blue-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                  })()}

                  {/* Date Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      Fecha
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Hora disponible
                      </label>
                      {isLoadingSlots ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          <p className="text-gray-500 mt-2">Buscando horarios...</p>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => {
                                setSelectedTime(slot)
                                setBookingStep(3)
                              }}
                              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                                selectedTime === slot
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">
                          No hay horarios disponibles para esta fecha
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Información del cliente */}
              {bookingStep === 3 && (
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  <button
                    type="button"
                    onClick={() => setBookingStep(bookingType === 'package' ? 1 : 2)}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft size={20} className="mr-1" />
                    Volver
                  </button>

                  {/* Resumen */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Resumen de tu reserva</p>
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {selectedService?.name || selectedPackage?.name}
                      </p>
                      {bookingType === 'service' && (
                        <>
                          <p className="text-sm text-gray-600">
                            📅 {selectedDate} a las {selectedTime}
                          </p>
                          {selectedStaff && (
                            <p className="text-sm text-gray-600">
                              👤 Con {selectedStaff.name}
                            </p>
                          )}
                        </>
                      )}
                      <p className="font-bold text-lg mt-2">
                        {bookingType === 'service' && usePackageSession ? (
                          <>
                            <span className="line-through text-gray-400">${selectedService?.price}</span>
                            <span className="ml-2 text-green-600">$0 (Usando paquete)</span>
                          </>
                        ) : (
                          <>Total: ${selectedService?.price || selectedPackage?.price}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Campos del formulario */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={bookingData.customerName}
                        onChange={(e) => setBookingData({...bookingData, customerName: e.target.value})}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                        placeholder="Juan Pérez"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={bookingData.customerEmail}
                        onChange={(e) => setBookingData({...bookingData, customerEmail: e.target.value})}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                        placeholder="juan@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        required
                        value={bookingData.customerPhone}
                        onChange={(e) => setBookingData({...bookingData, customerPhone: e.target.value})}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    {/* Paquetes disponibles del cliente - solo para servicios */}
                    {bookingType === 'service' && customerPackages.length > 0 && (
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                        <p className="font-semibold text-green-800 mb-3">
                          🎉 ¡Tienes paquetes disponibles!
                        </p>
                        <div className="space-y-2">
                          {customerPackages.map((pkg) => {
                            const isApplicable = pkg.package.services.some((ps: any) => 
                              ps.serviceId === selectedService?.id
                            )
                            if (!isApplicable) return null
                            
                            return (
                              <label 
                                key={pkg.id}
                                className="flex items-start space-x-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={usePackageSession && selectedCustomerPackage?.id === pkg.id}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCustomerPackage(pkg)
                                      setUsePackageSession(true)
                                    } else {
                                      setSelectedCustomerPackage(null)
                                      setUsePackageSession(false)
                                    }
                                  }}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {pkg.package.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {pkg.remainingSessions} sesiones disponibles
                                  </p>
                                  {pkg.expiryDate && (
                                    <p className="text-xs text-gray-500">
                                      Válido hasta: {new Date(pkg.expiryDate).toLocaleDateString()}
                                    </p>
                                  )}
                                  {usePackageSession && selectedCustomerPackage?.id === pkg.id && (
                                    <p className="text-sm font-medium text-green-600 mt-1">
                                      ✓ Usarás 1 sesión de este paquete
                                    </p>
                                  )}
                                </div>
                              </label>
                            )
                          })}
                          {!customerPackages.some(pkg => 
                            pkg.package.services.some((ps: any) => ps.serviceId === selectedService?.id)
                          ) && (
                            <p className="text-sm text-gray-600 italic">
                              Ninguno de tus paquetes incluye este servicio
                            </p>
                          )}
                        </div>
                        {usePackageSession && (
                          <div className="mt-3 p-2 bg-green-100 rounded-lg">
                            <p className="text-sm text-green-800">
                              <strong>Precio a pagar: $0</strong> (usando sesión del paquete)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Campo de método de pago - solo para paquetes */}
                    {bookingType === 'package' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Método de Pago *
                        </label>
                        <select
                          required
                          value={bookingData.paymentMethod}
                          onChange={(e) => setBookingData({...bookingData, paymentMethod: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                        >
                          <option value="CASH">Efectivo</option>
                          <option value="TRANSFER">Transferencia Bancaria</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Tu paquete quedará pendiente hasta confirmar el pago
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Notas adicionales (opcional)
                      </label>
                      <textarea
                        value={bookingData.notes}
                        onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors resize-none"
                        rows={3}
                        placeholder="Alguna petición especial..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    style={{ background: colors.gradient }}
                  >
                    {bookingType === 'package' ? 'Confirmar Compra' : 'Confirmar Reserva'}
                  </button>
                  
                  <p className="text-xs text-center text-gray-500">
                    Al confirmar, aceptas nuestros términos y condiciones
                  </p>
                </form>
              )}

              {/* Step 4: Confirmación de éxito */}
              {bookingStep === 4 && bookingSuccess && (
                <div className="space-y-6 text-center">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                    bookingType === 'package' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    {bookingType === 'package' ? (
                      <Clock size={40} className="text-yellow-600" />
                    ) : (
                      <Check size={40} className="text-green-600" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {bookingType === 'package' ? '¡Reserva de Paquete Registrada!' : '¡Reserva Confirmada!'}
                    </h3>
                    {bookingType === 'package' ? (
                      <>
                        <p className="text-gray-600 mb-3">
                          Tu reserva está <strong>pendiente de pago</strong>
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-left">
                          <p className="text-sm text-yellow-800">
                            <strong>Próximos pasos:</strong>
                          </p>
                          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                            {bookingData.paymentMethod === 'TRANSFER' ? (
                              <>
                                <li>• Realiza la transferencia bancaria</li>
                                <li>• Envía el comprobante al negocio</li>
                                <li>• Espera la confirmación de tu pago</li>
                              </>
                            ) : (
                              <>
                                <li>• Acércate al negocio para pagar en efectivo</li>
                                <li>• Una vez confirmado el pago, tu paquete será activado</li>
                              </>
                            )}
                            <li>• Recibirás un email de confirmación cuando esté activo</li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-600">
                          Te hemos enviado un email con los detalles de tu reserva
                        </p>
                        {lastBookingDetails?.usedPackage && (
                          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-left mt-3">
                            <p className="text-sm text-green-800">
                              <strong>✅ Sesión de paquete utilizada</strong>
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                              Se ha descontado 1 sesión de tu paquete: <strong>{lastBookingDetails.packageName}</strong>
                            </p>
                            {lastBookingDetails.remainingSessions !== undefined && (
                              <p className="text-sm text-green-600 mt-1">
                                Te quedan <strong>{lastBookingDetails.remainingSessions} sesiones</strong> disponibles
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Detalles de la reserva */}
                  <div className="bg-gray-50 p-4 rounded-xl text-left space-y-3">
                    <h4 className="font-semibold text-gray-900">
                      Detalles de tu {bookingType === 'package' ? 'compra' : 'reserva'}:
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{bookingType === 'package' ? 'Paquete:' : 'Servicio:'}</span>
                        <span className="font-medium">{lastBookingDetails?.service}</span>
                      </div>
                      {bookingType === 'service' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fecha:</span>
                            <span className="font-medium">{lastBookingDetails?.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Hora:</span>
                            <span className="font-medium">{lastBookingDetails?.time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Profesional:</span>
                            <span className="font-medium">{lastBookingDetails?.staff}</span>
                          </div>
                        </>
                      )}
                      {bookingType === 'package' && selectedPackage && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sesiones incluidas:</span>
                          <span className="font-medium">{selectedPackage.sessionCount || 1}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cliente:</span>
                        <span className="font-medium">{lastBookingDetails?.customerName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        resetBookingForm()
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      {bookingType === 'package' ? 'Comprar otro paquete' : 'Hacer otra reserva'}
                    </button>
                    <button
                      onClick={() => {
                        setShowBookingModal(false)
                        resetBookingForm()
                      }}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                    >
                      Cerrar
                    </button>
                  </div>

                  <p className="text-xs text-gray-500">
                    Recibirás un recordatorio 24 horas antes de tu cita
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {loginMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </h2>
                <button
                  onClick={() => {
                    setShowLoginModal(false)
                    setLoginError('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {loginMode === 'verify' ? (
                  // Verification code input
                  <>
                    <div className="text-center mb-4">
                      <p className="text-gray-600">
                        Hemos enviado un código de verificación a:
                      </p>
                      <p className="font-semibold">{loginForm.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código de Verificación
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-bold tracking-wider"
                        placeholder="000000"
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoggingIn || verificationCode.length !== 6}
                      className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                      style={{ background: colors.gradient }}
                    >
                      {isLoggingIn ? 'Verificando...' : 'Verificar Código'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode('register')
                        setVerificationSent(false)
                        setVerificationCode('')
                        setLoginError('')
                      }}
                      className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      ← Volver
                    </button>
                  </>
                ) : (
                  // Regular login/register form
                  <>
                    {loginMode === 'register' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          value={loginForm.name}
                          onChange={(e) => setLoginForm({...loginForm, name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required={loginMode === 'register'}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        minLength={6}
                      />
                    </div>

                    {loginMode === 'register' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono (Opcional)
                        </label>
                        <input
                          type="tel"
                          value={loginForm.phone}
                          onChange={(e) => setLoginForm({...loginForm, phone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                      style={{ background: colors.gradient }}
                    >
                      {isLoggingIn ? 'Procesando...' : 
                       loginMode === 'login' ? 'Iniciar Sesión' : 
                       'Enviar Código de Verificación'}
                    </button>
                  </>
                )}
              </form>

              {loginMode !== 'verify' && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setLoginMode(loginMode === 'login' ? 'register' : 'login')
                      setLoginError('')
                      setVerificationSent(false)
                      setVerificationCode('')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {loginMode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Appointments Modal */}
      {isAuthenticated && myAppointments.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => {
              // Show appointments in booking modal
              setBookingType('use-package')
              setShowBookingModal(true)
              setBookingStep(1)
            }}
            className="bg-white rounded-full shadow-lg px-4 py-3 flex items-center gap-2 hover:shadow-xl transition-all"
          >
            <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
            <span className="font-medium">Mis Citas ({myAppointments.filter((a: any) => new Date(a.startTime) >= new Date()).length})</span>
          </button>
        </div>
      )}
    </div>
  )
}