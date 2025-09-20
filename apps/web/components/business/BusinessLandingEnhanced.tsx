'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Star, MapPin, Phone, Mail, Clock, Calendar, Users, Package, 
  ChevronLeft, X, Check, Eye, ChevronRight,
  Instagram, Facebook, Twitter, Award, Shield, Sparkles,
  ArrowRight, User, DollarSign, Info, Image as ImageIcon, Gift,
  LogIn, LogOut, UserCircle, UserCheck, UserPlus
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'
import { getImageUrl, getImageSrcSet, getPlaceholderUrl } from '@/lib/upload-utils-client'
import Lightbox from '@/components/ui/Lightbox'
import { formatPrice, formatCurrency, formatDiscount } from '@/lib/format-utils'
import { getGoogleMapsDirectionsUrl } from '@/lib/maps-utils'
import { useClientAuth } from '@/contexts/ClientAuthContext'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'

interface BusinessLandingProps {
  business: any
}

export default function BusinessLandingEnhanced({ business }: BusinessLandingProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  
  // Usar el contexto de autenticación global
  const { isAuthenticated, clientData, checkAuth, logout, isRegisteredInBusiness } = useClientAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const isRegistered = isRegisteredInBusiness(business.id)
  
  // Estados de autenticación local (para el modal de login/registro)
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
  const [staff, setStaff] = useState<any[]>([])
  const [staffModuleEnabled, setStaffModuleEnabled] = useState(false)
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0)
  const [bookingType, setBookingType] = useState<'service' | 'package' | 'use-package'>('service')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [servicesCategory, setServicesCategory] = useState<string>('all')
  const [servicesPage, setServicesPage] = useState(0)
  // Public gallery state
  const [galleryCategory, setGalleryCategory] = useState<string>('all')
  const [galleryPage, setGalleryPage] = useState(0)
  // Packages pagination state
  const [packagesPage, setPackagesPage] = useState(0)
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
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set())
  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxItems, setLightboxItems] = useState<any[]>([])
  
  // Datos del negocio
  const reviews = business.reviews || []
  const galleryItems = business.galleryItems || []

  // Helper to resolve gallery image src/srcSet from either stored URL or imageId
  const resolveGallerySources = (urlOrId?: string | null, size: number = 800) => {
    if (!urlOrId) {
      return { src: getPlaceholderUrl('gallery'), srcSet: '' }
    }
    const value = String(urlOrId)
    // If it's a full/relative URL, use it and try to derive srcset if pattern matches
    if (value.startsWith('http') || value.startsWith('/')) {
      const match = value.match(/\/gallery\/([^_]+)_\d+\.webp/i)
      const imgId = match?.[1]
      return {
        src: value,
        srcSet: imgId ? getImageSrcSet(imgId, 'gallery') : ''
      }
    }
    // Otherwise assume it's an image id
    return {
      src: getImageUrl(value, 'gallery', size),
      srcSet: getImageSrcSet(value, 'gallery')
    }
  }
  
  // Si el módulo de staff está deshabilitado y hay owner, mostrar el owner como único profesional
  let displayStaff = business.staff || []
  const owner = business.tenant?.users?.[0]
  
  // Debug logging
  console.log('Owner data:', owner)
  console.log('Owner avatar:', owner?.avatar)
  console.log('Staff module enabled:', business.enableStaffModule)
  console.log('Staff length:', displayStaff.length)
  
  // Si no hay módulo de staff habilitado, mostrar el owner como único trabajador
  if (!business.enableStaffModule) {
    displayStaff = []
  }

  
  // Horarios para mostrar en UI (siempre basados en settings.scheduleSettings cuando existan)
  const scheduleSettings = business.settings?.scheduleSettings || null
  const baseWorkingHours = Array.isArray(business.workingHours) ? business.workingHours : []
  const workingHours = scheduleSettings
    ? [0,1,2,3,4,5,6].map((day: number) => ({
        dayOfWeek: day,
        isActive: Array.isArray(scheduleSettings.workingDays) ? scheduleSettings.workingDays.includes(day) : false,
        startTime: scheduleSettings.startTime || '09:00',
        endTime: scheduleSettings.endTime || '18:00'
      }))
    : baseWorkingHours.filter((wh: any) => !wh.staffId)
  
  // Colores del tema
  const colors = {
    primary: business.settings?.theme?.primaryColor || '#6366F1',
    accent: business.settings?.theme?.accentColor || '#F59E0B',
    gradient: `linear-gradient(135deg, ${business.settings?.theme?.primaryColor || '#6366F1'} 0%, ${business.settings?.theme?.accentColor || '#F59E0B'} 100%)`
  }
  
  // Font and button styles
  const fontFamily = business.settings?.theme?.fontFamily || 'inter'
  const buttonStyle = business.settings?.theme?.buttonStyle || 'rounded'

  // UI options
  const asBool = (v: any, fallback: boolean) => {
    if (typeof v === 'boolean') return v
    if (typeof v === 'string') return v.toLowerCase() === 'true'
    if (typeof v === 'number') return v !== 0
    return fallback
  }
  const ui = business.settings?.ui || {}
  const heroButtonStyleOverride = (ui && typeof (ui as any).heroButtonStyle === 'string' && (ui as any).heroButtonStyle.trim() !== '')
    ? (ui as any).heroButtonStyle as string
    : null
  const tagline = (ui && typeof ui.tagline === 'string' && ui.tagline.trim() !== '')
    ? ui.tagline
    : (business.description || t('professionalQuality'))
  const chipsSticky = ui.chipsSticky !== false
  const paginationStyle = ui.paginationStyle || 'numbered'
  const heroOverlay = ui.heroOverlay || 'strong'
  const cardRadius = ui.cardRadius || 'xl'
  const shadowStyle = ui.shadowStyle || 'soft'
  const showMobileStickyCTA = asBool(ui.showMobileStickyCTA, true)
  const showDesktopFloatingDirection = asBool(ui.showDesktopFloatingDirection, true)
  const typographyScale = ui.typographyScale || 'M'

  const overlayClass = heroOverlay === 'light'
    ? 'from-black/40 via-black/25 to-black/50'
    : heroOverlay === 'medium'
    ? 'from-black/50 via-black/35 to-black/60'
    : 'from-black/60 via-black/40 to-black/70'

  const radiusCls = cardRadius === 'md' ? 'rounded-xl' : cardRadius === 'lg' ? 'rounded-2xl' : 'rounded-[1.25rem]'
  const shadowCls = shadowStyle === 'md' ? 'shadow-md hover:shadow-lg' : 'shadow-sm hover:shadow-lg'
  const h1Cls = typographyScale === 'L' ? 'text-5xl sm:text-7xl' : typographyScale === 'S' ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-6xl'
  const h2Cls = typographyScale === 'L' ? 'text-5xl' : typographyScale === 'S' ? 'text-3xl' : 'text-4xl'

  // Apply body text scale by tweaking root font-size via CSS var
  useEffect(() => {
    const size = ui.bodyScale === 'L' ? '17px' : ui.bodyScale === 'S' ? '15px' : '16px'
    const prev = document.documentElement.style.getPropertyValue('--root-font')
    document.documentElement.style.setProperty('--root-font', size)
    return () => { document.documentElement.style.setProperty('--root-font', prev || '16px') }
  }, [ui.bodyScale])
  
  // Button style mapping
  const getButtonClasses = (baseClasses: string = '', styleName?: string) => {
    const styleClasses = {
      soft: 'rounded-lg shadow-md',
      rounded: 'rounded-lg',
      square: 'rounded-none',
      pill: 'rounded-full',
      gradient: 'rounded-lg',
      'soft-rounded': 'rounded-2xl',
      outlined: 'rounded-lg border-2',
      'outline-dashed': 'rounded-lg border-2 border-dashed',
      ghost: 'rounded-lg border-2 border-transparent',
      link: 'rounded-none underline shadow-none',
      shadow: 'rounded-lg shadow-lg',
      '3d': 'rounded-lg'
    }
    const normalize = (s?: string) => (s === 'oval' ? 'pill' : s)
    const key = (normalize(styleName) || normalize(buttonStyle)) as keyof typeof styleClasses
    return `${baseClasses} ${styleClasses[key] || styleClasses.rounded}`
  }

  const isBorderOnly = (styleName?: string) => ['outlined', 'outline-dashed', 'ghost', 'link'].includes(styleName || buttonStyle)
  const getVisualProps = (
    variant: 'primary' | 'secondary' = 'primary',
    size: 'sm' | 'md' | 'lg' = 'lg',
    extraClasses = '',
    styleName?: string
  ) => {
    const hexToRgba = (hex: string, alpha: number) => {
      const h = hex.replace('#', '')
      const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
      const r = (bigint >> 16) & 255
      const g = (bigint >> 8) & 255
      const b = bigint & 255
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    if (styleName === '__translucent') {
      // Compact on mobile, roomier on larger screens
      const className = `px-4 py-2 sm:px-6 sm:py-3 font-bold rounded-full text-white backdrop-blur-md bg-white/10 border border-white/20 transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 ${variant==='primary' ? 'shadow-xl hover:shadow-2xl' : 'hover:shadow-lg'} ${extraClasses}`
      return { className, style: {} as any }
    }
    if (styleName === '__translucentHeader') {
      // More compact chips on mobile for header; expand on sm+
      const className = `px-3 py-1.5 sm:px-5 sm:py-2.5 text-sm sm:text-base font-semibold rounded-full border transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 ${variant==='primary' ? 'shadow-sm hover:shadow' : 'hover:shadow'} ${extraClasses}`
      const style: any = {
        color: colors.primary,
        background: hexToRgba(colors.primary, 0.22),
        borderColor: hexToRgba(colors.primary, 0.50)
      }
      return { className, style }
    }
    const spacing = size === 'sm' ? 'px-4 py-2' : size === 'md' ? 'px-6 py-3' : 'px-8 py-4'
    const className = getButtonClasses(`${spacing} font-bold transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 text-white ${variant==='primary' ? 'shadow-xl hover:shadow-2xl' : 'hover:shadow-lg'} ${extraClasses}`, styleName)
    if (isBorderOnly(styleName)) {
      const style: any = { background: 'transparent', color: variant==='primary' ? colors.primary : colors.accent }
      const st = styleName || buttonStyle
      if (st === 'outlined' || st === 'outline-dashed') {
        style.borderColor = variant==='primary' ? colors.primary : colors.accent
      }
      return { className, style }
    }
    const style = {
      background: (ui.useGradientButtons || (styleName || buttonStyle) === 'gradient')
        ? colors.gradient
        : (variant === 'primary' ? colors.primary : colors.accent),
      color: '#FFFFFF'
    }
    return { className, style }
  }
  
  // Get font family CSS
  const getFontFamilyStyle = () => {
    const fontMap: Record<string, string> = {
      inter: '"Inter", sans-serif',
      playfair: '"Playfair Display", serif',
      montserrat: '"Montserrat", sans-serif',
      roboto: '"Roboto", sans-serif',
      poppins: '"Poppins", sans-serif',
      lato: '"Lato", sans-serif',
      opensans: '"Open Sans", sans-serif',
      raleway: '"Raleway", sans-serif',
      nunito: '"Nunito", sans-serif',
      merriweather: '"Merriweather", serif',
      sourcesans: '"Source Sans Pro", sans-serif',
      worksans: '"Work Sans", sans-serif'
    }
    return { fontFamily: fontMap[fontFamily] || fontMap.inter }
  }

  // Días de la semana vía i18n
  const daysOfWeek = [
    t('sunday'),
    t('monday'),
    t('tuesday'),
    t('wednesday'),
    t('thursday'),
    t('friday'),
    t('saturday')
  ]

  // Derived values moved out of JSX to avoid parser quirks
  const todayIdx = new Date().getDay()
  const todayWh = (workingHours || []).find((wh: any) => wh.dayOfWeek === todayIdx)
  const todayHoursText = todayWh && todayWh.isActive ? `${todayWh.startTime} - ${todayWh.endTime}` : t('todayClosed')

  const serviceCategoriesList: string[] = Array.from(new Set(
    (business.services || []).map((s: any) => s.category).filter(Boolean)
  )) as string[]
  const showServiceCategoryFilter = serviceCategoriesList.length > 1

  // Services grid pagination helpers
  const servicesPerPage = 6
  const filteredServices = servicesCategory === 'all'
    ? business.services
    : business.services?.filter((s: any) => s.category === servicesCategory)
  const totalPages = Math.ceil((filteredServices?.length || 0) / servicesPerPage)
  const startIndex = servicesPage * servicesPerPage
  const endIndex = startIndex + servicesPerPage
  const currentServices = filteredServices?.slice(startIndex, endIndex) || []

  // Helper to render staff specialties
  const renderMemberSpecialties = (member: any) => {
    if (!member?.specialties) return null
    if (member.specialties === '0' || member.specialties === 0 || member.specialties === '') return null
    if (Array.isArray(member.specialties)) {
      const valid = member.specialties.filter((s: any) => s && s !== '0' && s !== 0)
      if (valid.length === 0) return null
      return (
        <p className="text-sm text-gray-500 mt-1">{valid.join(', ')}</p>
      )
    }
    if (typeof member.specialties === 'string' && member.specialties.trim() !== '') {
      return (
        <p className="text-sm text-gray-500 mt-1">{member.specialties}</p>
      )
    }
    return null
  }

  // Auto-fill booking data cuando hay cliente autenticado
  useEffect(() => {
    if (isAuthenticated && clientData) {
      // Auto-fill booking data
      setBookingData(prev => ({
        ...prev,
        customerName: clientData.name || '',
        customerEmail: clientData.email || '',
        customerPhone: clientData.phone || ''
      }))
      // Load customer packages and appointments if registered in this business
      if (isRegistered) {
        loadCustomerData()
      }
    }
  }, [isAuthenticated, clientData, isRegistered])

  // Load customer packages and appointments
  const loadCustomerData = async () => {
    try {
      // Load packages
      const packagesResponse = await fetch('/api/cliente/dashboard', {
        credentials: 'include' // Use cookies instead of token
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
          toast(`Código de verificación (solo desarrollo): ${data.devCode}`, 'info')
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

        // Success - cookies are set by the server automatically
        // Actualizar el contexto global
        await checkAuth()
        
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
        // Normal login - incluir el businessSlug para determinar el tenant correcto
        const response = await fetch('/api/cliente/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...loginForm,
            businessSlug: business.customSlug || business.slug
          })
        })

        const data = await response.json()

        if (!response.ok) {
          // Manejar advertencias de intentos y bloqueo
          if (data.warning) {
            setLoginError(`${data.error}. ${data.warning}`)
          } else if (data.locked) {
            setLoginError(data.error)
          } else {
            setLoginError(data.error || 'Error al iniciar sesión')
          }
          setIsLoggingIn(false) // Importante: detener el estado de carga
          return
        }

        // Cookies are set by the server automatically
        // Actualizar el contexto global
        await checkAuth()
        
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

  // Handle logout ahora se maneja desde el contexto con logout()

  // Cancel appointment modal handlers
  const openCancelModal = (appointmentId: string) => {
    if (!isAuthenticated) {
      toast('Debes iniciar sesión para cancelar citas', 'info')
      return
    }
    setAppointmentToCancel(appointmentId)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return
    setIsCancelling(true)
    try {
      const response = await fetch('/api/cliente/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentId: appointmentToCancel, reason: cancelReason || '' })
      })
      if (response.ok) {
        setShowCancelModal(false)
        setAppointmentToCancel(null)
        setCancelReason('')
        await loadCustomerData()
      } else {
        let msg = 'Error al cancelar la cita'
        try { const error = await response.json(); msg = error?.error || msg } catch {}
        toast(msg, 'error')
      }
    } catch (e) {
      console.error('Error canceling appointment:', e)
      toast('Error al cancelar la cita', 'error')
    } finally {
      setIsCancelling(false)
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
      // Solo agregar staffId si hay un staff seleccionado
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

  // Fetch staff when service is selected
  useEffect(() => {
    const fetchStaff = async () => {
      if (!selectedService || !business.enableStaffModule) {
        setStaff([])
        setStaffModuleEnabled(false)
        return
      }
      try {
        const response = await fetch(`/api/public/staff/${business.slug || business.customSlug || business.id}?serviceId=${selectedService.id}`)
        if (response.ok) {
          const data = await response.json()
          setStaff(data.staff || [])
          setStaffModuleEnabled(data.moduleEnabled || false)
        }
      } catch (error) {
        console.error('Error fetching staff:', error)
        setStaff([])
        setStaffModuleEnabled(false)
      }
    }
    
    fetchStaff()
  }, [selectedService, business])

  // Obtener paquetes activos cuando el usuario está autenticado
  useEffect(() => {
    const fetchAuthenticatedCustomerPackages = async () => {
      if (isAuthenticated && clientData?.email) {
        setIsLoadingPackages(true)
        try {
          const response = await fetch(`/api/public/customer/packages?email=${encodeURIComponent(clientData.email)}&businessId=${business.id}`)
          if (response.ok) {
            const data = await response.json()
            setCustomerPackages(data.packages || [])
            setHasSearchedPackages(true)
          }
        } catch (error) {
          console.error('Error fetching authenticated customer packages:', error)
        } finally {
          setIsLoadingPackages(false)
        }
      }
    }

    fetchAuthenticatedCustomerPackages()
  }, [isAuthenticated, clientData?.email, business.id])

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
        let errorMsg = 'Error al crear la reserva'
        try {
          const error = await response.json()
          if (error?.error) errorMsg = error.error
          if (process.env.NODE_ENV !== 'production') {
            const extra = [error?.step, error?.details].filter(Boolean).join(' - ')
            if (extra) errorMsg += `\n(${extra})`
          }
        } catch {}
        toast(errorMsg, 'error')
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast('Ocurrió un error. Por favor intenta nuevamente.', 'error')
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

  // Calcular rating promedio sin hooks para evitar problemas de parseo
  const typedReviews: Array<{ rating?: number | null }> = Array.isArray(reviews) ? reviews : []
  const averageRating = typedReviews.length > 0
    ? typedReviews.reduce((acc, r) => acc + (typeof r?.rating === 'number' ? r.rating : 0), 0) / typedReviews.length
    : 5

  const __jsx_root = (
    <div className="min-h-screen bg-gray-50" style={getFontFamilyStyle()}>
      {/* Header flotante mejorado */}
      <header className="fixed top-0 w-full backdrop-blur-xl bg-white/70 border-b border-gray-100 z-50 shadow-sm">
        <nav className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {business.logo && (
                <div className="relative">
                  <img 
                    src={business.logo.startsWith('data:') ? business.logo : getImageUrl(business.logo, 'business', 256)} 
                    srcSet={business.logo.startsWith('data:') ? '' : getImageSrcSet(business.logo, 'business')}
                    sizes="(max-width: 640px) 48px, 64px"
                    alt={business.name} 
                    className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl object-cover shadow-md border-2 border-white/20"
                    loading="eager"
                  />
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                  {business.name}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">{business.category || t('professionalServices')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* User menu */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {((ui as any).useTranslucentHeroButtons) ? (
                    (() => { const vp = getVisualProps('secondary','md','', '__translucentHeader'); return (
                      <Link
                        href={`/cliente/dashboard?from=${encodeURIComponent(`/${business.customSlug || business.slug}`)}`}
                        className={vp.className}
                        style={{ ...vp.style, background: 'rgba(59,130,246,0.20)', borderColor: 'rgba(147,197,253,0.70)', color: '#1d4ed8' }}
                        title={t('goToMyPortal')}
                      >
                        <UserCircle className="w-5 h-5" style={{ color: '#1d4ed8' }} />
                        <span
                          className="hidden sm:inline text-sm sm:text-base font-bold"
                          style={{ color: '#1d4ed8' }}
                        >
                          {clientData?.name?.split(' ')[0] || clientData?.name}
                        </span>
                        {isRegistered && (
                          <Check className="w-4 h-4 ml-1" style={{ color: colors.accent }} />
                        )}
                      </Link>
                    )})()
                  ) : (
                    (() => { const vp = getVisualProps('secondary','md','', '__translucentHeader'); return (
                      <Link
                        href={`/cliente/dashboard?from=${encodeURIComponent(`/${business.customSlug || business.slug}`)}`}
                        className={vp.className}
                        style={{ ...vp.style, background: 'rgba(59,130,246,0.20)', borderColor: 'rgba(147,197,253,0.70)', color: '#1d4ed8' }}
                        title={t('goToMyPortal')}
                      >
                        <UserCircle className="w-5 h-5" style={{ color: '#1d4ed8' }} />
                        <span
                          className="hidden sm:inline text-sm sm:text-base font-bold"
                          style={{ color: '#1d4ed8' }}
                        >
                          {clientData?.name?.split(' ')[0] || clientData?.name}
                        </span>
                        {isRegistered && (
                          <Check className="w-4 h-4 ml-1" style={{ color: colors.accent }} />
                        )}
                      </Link>
                    )})()
                  )}
                  {((ui as any).useTranslucentHeroButtons) ? (
                    (() => { const vp = getVisualProps('secondary','md','', '__translucentHeader'); return (
                      <button
                        onClick={() => logout()}
                        className={vp.className}
                        style={vp.style}
                        title={t('signOut')}
                      >
                        <LogOut className="w-5 h-5" style={{ color: colors.primary }} />
                        <span className="hidden sm:inline text-sm font-medium" style={{ color: colors.primary }}>{t('signOut')}</span>
                      </button>
                    )})()
                  ) : (
                    <button
                      onClick={() => logout()}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title={t('signOut')}
                    >
                      <LogOut className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
              ) : (
                ((ui as any).useTranslucentHeroButtons) ? (
                  (() => { const vp = getVisualProps('secondary','md','', '__translucentHeader'); return (
                    <button
                      onClick={() => {
                        const currentUrl = encodeURIComponent(window.location.href)
                        window.location.href = `/cliente/login?from=${currentUrl}`
                      }}
                      className={vp.className}
                      style={{ ...vp.style, background: 'rgba(59,130,246,0.20)', borderColor: 'rgba(147,197,253,0.70)', color: '#1d4ed8' }}
                    >
                      <LogIn className="w-5 h-5" style={{ color: '#1d4ed8' }} />
                      <span className="hidden sm:inline text-sm font-bold" style={{ color: '#1d4ed8' }}>{t('signIn')}</span>
                    </button>
                  )})()
                ) : (
                  (() => { const vp = getVisualProps('secondary','md','', '__translucentHeader'); return (
                    <button
                      onClick={() => {
                        const currentUrl = encodeURIComponent(window.location.href)
                        window.location.href = `/cliente/login?from=${currentUrl}`
                      }}
                      className={vp.className}
                      style={{ ...vp.style, background: 'rgba(59,130,246,0.20)', borderColor: 'rgba(147,197,253,0.70)', color: '#1d4ed8' }}
                    >
                      <LogIn className="w-5 h-5" style={{ color: '#1d4ed8' }} />
                      <span className="hidden sm:inline text-sm font-bold" style={{ color: '#1d4ed8' }}>{t('signIn')}</span>
                    </button>
                  )})()
                )
              )}
              
              <LanguageSelector />
              {(() => {
                const styleKey = (ui as any).useTranslucentHeroButtons ? '__translucentHeader' : (heroButtonStyleOverride || undefined)
                const vp = getVisualProps('primary','md','', styleKey)
                return (
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className={vp.className}
                    style={vp.style}
                  >
                    <span className="hidden sm:inline">{t('bookAppointmentCTA')}</span>
                    <span className="sm:hidden">{t('bookShort')}</span>
                  </button>
                )
              })()}
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
                  {(() => {
                    const { src, srcSet } = resolveGallerySources(item.url || item.id, 1200)
                    return (
                      <img
                        src={src}
                        srcSet={srcSet}
                    sizes="100vw"
                    alt={item.title || 'Gallery'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                      />
                    )
                  })()}
                  <div className={`absolute inset-0 bg-gradient-to-b ${overlayClass}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenido del hero */}
        <div className="relative container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4 mt-4 sm:mt-6">
              <Shield className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm">{t('verifiedBusiness')}</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-4">
              {business.name}
            </h1>
            
            <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              {tagline}
            </p>

            {/* Stats mejorados */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <Users className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">
                  {(business.stats?.completedAppointments || 0) + ''}+
                  {' '}{t('clientsLower')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <Star className="w-5 h-5" style={{ color: colors.accent }} />
                <span className="text-white font-semibold">
                  {averageRating.toFixed(1)} ({reviews.length} {t('reviewsLower')})
                </span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <Award className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">
                  {t('topProfessional')}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              {(ui.heroButtons?.showPrimary !== false) && (() => { const styleKey = (ui as any).useTranslucentHeroButtons ? '__translucent' : (heroButtonStyleOverride || undefined); const vp = getVisualProps('primary','lg','', styleKey); return (
              <button
                onClick={() => setShowBookingModal(true)}
                className={vp.className}
                style={vp.style}
              >
                {(ui.heroButtons?.primaryText && ui.heroButtons?.primaryText.trim()) ? ui.heroButtons?.primaryText : t('bookNow')}
                <ArrowRight className="w-5 h-5" />
              </button>
              )})()}
              {(ui.heroButtons?.showAuth !== false) && (isAuthenticated ? (
                (() => { const styleKey = (ui as any).useTranslucentHeroButtons ? '__translucent' : (heroButtonStyleOverride || undefined); const vp = getVisualProps('secondary','lg','', styleKey); return (
                <Link
                  href={`/cliente/dashboard?from=${encodeURIComponent(`/${business.customSlug || business.slug}`)}`}
                  className={vp.className}
                  style={vp.style}
                >
                  <UserCircle className="w-5 h-5" />
                  {t('myPortal')}
                </Link>
                )})()
              ) : (
                (() => { const styleKey = (ui as any).useTranslucentHeroButtons ? '__translucent' : (heroButtonStyleOverride || undefined); const vp = getVisualProps('secondary','lg','', styleKey); return (
                <button
                  onClick={() => {
                    const currentUrl = encodeURIComponent(window.location.href)
                    window.location.href = `/cliente/login?from=${currentUrl}`
                  }}
                  className={vp.className}
                  style={vp.style}
                >
                  <LogIn className="w-5 h-5" />
                  {t('signIn')}
                </button>
                )})()
              ))}
              
              {(ui.heroButtons?.showServices !== false) && (() => { const styleKey = (ui as any).useTranslucentHeroButtons ? '__translucent' : (heroButtonStyleOverride || undefined); const vp = getVisualProps('secondary','lg','', styleKey); return (
              <a
                href="#services"
                className={vp.className}
                style={vp.style}
              >
                {(ui.heroButtons?.servicesText && ui.heroButtons?.servicesText.trim()) ? ui.heroButtons?.servicesText : t('services')}
              </a>
              )})()}
              {galleryItems.length > 0 && (ui.heroButtons?.showGallery !== false) && (
                (() => { const styleKey = (ui as any).useTranslucentHeroButtons ? '__translucent' : (heroButtonStyleOverride || undefined); const vp = getVisualProps('secondary','lg','', styleKey); return (
                <a
                  href="#gallery"
                  className={vp.className}
                  style={vp.style}
                >
                  {(ui.heroButtons?.galleryText && ui.heroButtons?.galleryText.trim()) ? ui.heroButtons?.galleryText : t('gallery')}
                </a>
                )})()
              )}
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
                      ? 'w-8' 
                      : 'w-4 bg-white/40 hover:bg-white/60'
                      }`}
                      style={index === activeGalleryIndex ? { background: colors.gradient } : undefined}
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
                {(() => {
                  const today = new Date().getDay()
                  const h = workingHours.find((wh: any) => wh.dayOfWeek === today)
                  return (
                    <p className="font-semibold">{h && h.isActive ? `${h.startTime} - ${h.endTime}` : t('todayClosed')}</p>
                  )
                })()}
              </div>
            </div>
            
            {business.address && (
              <a 
                href={getGoogleMapsDirectionsUrl(business.address, business.city, business.state)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
                title="Ver en Google Maps"
              >
                <div className="relative">
                  <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: colors.accent }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 group-hover:text-gray-700">📍 {t('howToGetThere')}</p>
                  <p className="font-semibold group-hover:underline">
                    {business.address}
                    {business.city && `, ${business.city}`}
                  </p>
                </div>
              </a>
            )}
            
            {!business.address && business.city && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                <div>
                  <p className="text-xs text-gray-500">{t('location')}</p>
                  <p className="font-semibold">{business.city}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" style={{ color: colors.primary }} />
              <div>
                <p className="text-xs text-gray-500">{t('phone')}</p>
                <p className="font-semibold">{business.phone || t('contact')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5" style={{ color: colors.primary }} />
              <div>
                <p className="text-xs text-gray-500">{t('fromLabel')}</p>
                <p className="font-semibold">
                  {formatCurrency(Math.min(...(business.services?.map((s: any) => s.price) || [0])))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section mejorada */}
      <section id="services" className="py-2 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
              {t('services')}
            </span>
            <h2 className={`${h2Cls} font-black mt-2 mb-4`}>
              {t('whatWeOffer')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('tailoredToYourNeeds')}
            </p>
          </div>

          {/* Filtros de categoría (sticky + horizontal scroll en móvil) */}
          {(() => {
            const categories = Array.from(new Set(
              business.services?.map((s: any) => s.category).filter(Boolean)
            )) as string[]
            
            if (categories.length > 1) {
                return (
                  <div className={`flex justify-center mb-8 ${chipsSticky ? 'sticky top-24 z-10' : ''}`}>
                    <div className="inline-flex flex-wrap gap-2 p-1 bg-gray-100 rounded-full overflow-x-auto no-scrollbar max-w-full">
                      <button
                        onClick={() => {
                          setServicesCategory('all')
                          setServicesPage(0)
                        }}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all focus-visible:ring-2 ring-offset-2 ${
                        servicesCategory === 'all'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      >
                        {t('all')}
                      </button>
                      {categories.map((category: string) => (
                        <button
                          key={category}
                          onClick={() => {
                            setServicesCategory(category)
                            setServicesPage(0)
                          }}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all focus-visible:ring-2 ring-offset-2 ${
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
                      className={`group bg-white ${radiusCls} ${shadowCls} transition-all duration-300 overflow-hidden`}
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
                          {/* Indicador de paquete disponible */}
                          {customerPackages.some((pkg: any) => 
                            pkg.remainingSessions > 0 && 
                            pkg.package.services.some((ps: any) => ps.serviceId === service.id)
                          ) && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                              <Gift className="w-3 h-3" />
                              {t('packageAvailable')}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {service.description || 'Servicio profesional de calidad'}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" style={{ color: colors.primary }} />
                  <span className="text-sm">{service.duration} min</span>
                </div>
                          <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                            {formatCurrency(service.price)}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedService(service)
                            setBookingType('service')
                            setShowBookingModal(true)
                          }}
                          className={getVisualProps('primary','md','w-full').className}
                          style={getVisualProps('primary','md','w-full').style}
                      >
                          {t('bookAppointmentCTA')}
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
                    {paginationStyle === 'numbered' ? (
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
                            style={{ background: i === servicesPage ? colors.gradient : undefined }}
                            aria-current={i === servicesPage}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-600">{servicesPage + 1} / {totalPages}</span>
                    )}
                    
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
        <section className="py-1" style={{ background: colors.gradient, opacity: 0.06 }}>
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-2">
              <h2 className="text-3xl font-bold mb-2">{t('myAccount')}</h2>
              <p className="text-gray-600">{t('managePackagesAndAppointments')}</p>
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
                        className={getButtonClasses("mt-4 w-full py-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed")}
                        style={{ 
                          background: purchasedPkg.remainingSessions > 0 
                            ? ((ui.useGradientButtons || buttonStyle === 'gradient') ? colors.gradient : colors.primary)
                            : '#e5e7eb',
                          color: purchasedPkg.remainingSessions > 0 ? 'white' : '#9ca3af'
                        }}
                      >
                        {purchasedPkg.remainingSessions > 0 ? t('useMyPackage') : t('noSessionsShort')}
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
                  {t('myUpcomingAppointments')}
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
                            {appointment.status === 'CONFIRMED' ? t('confirmed') : 
                             appointment.status === 'PENDING' ? t('pending') : appointment.status}
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
                          onClick={() => openCancelModal(appointment.id)}
                          className="mt-4 w-full py-2 rounded-lg font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all"
                        >
                          {t('cancelAppointment')}
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
        <section id="packages" className="py-2 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12" style={{ background: 'transparent' }}>
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                {t('specialOffers')}
              </span>
              <h2 className="text-4xl font-black mt-2 mb-4">
                {t('packagesAndPromos')}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">{t('saveWithPackages')}</p>
            </div>

            {(() => {
              const perPage = 6
              const totalPages = Math.ceil((business.packages?.length || 0) / perPage)
              const startIndex = packagesPage * perPage
              const pageItems = business.packages.slice(startIndex, startIndex + perPage)

              return (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pageItems.map((pkg: any) => {
                const visibleServices = pkg.services?.slice(0, 3) || []
                const remainingCount = (pkg.services?.length || 0) - 3
                
                return (
                  <div 
                    key={pkg.id} 
                    className={`relative group bg-gradient-to-br from-gray-50 to-white ${radiusCls} ${shadowCls} transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full`}
                  >
                    {pkg.discount && (
                      <div className="absolute top-4 right-4 text-white px-3 py-1 rounded-full text-sm font-bold z-10" style={{ background: colors.accent }}>
                        -{formatDiscount(pkg.discount)}%
                      </div>
                    )}
                    
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="w-8 h-8" style={{ color: colors.primary }} />
                        <div>
                          <h3 className="text-xl font-bold">{pkg.name}</h3>
                          {pkg.sessionCount && (
                            <span className="text-sm text-gray-500">
                              {pkg.sessionCount} {t('includedSessions')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-6 line-clamp-2">
                        {pkg.description || 'Paquete especial con descuento'}
                      </p>
                      
                      <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold" style={{ color: colors.primary }}>
                            {formatCurrency(pkg.price)}
                          </span>
                          {pkg.originalPrice && (
                            <span className="text-lg text-gray-400 line-through">
                              {formatCurrency(pkg.originalPrice)}
                            </span>
                          )}
                        </div>
                        {pkg.validityDays && (
                          <p className="text-sm text-gray-500 mt-1">
                            Válido por {pkg.validityDays} días
                          </p>
                        )}
                      </div>
                      
                      <div className="flex-1 mb-6">
                        <div className={`${expandedPackages.has(pkg.id) 
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48' 
                          : 'h-24'} overflow-y-auto custom-scrollbar transition-all duration-300`}>
                          {expandedPackages.has(pkg.id) ? (
                            pkg.services.map((ps: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span className="text-xs text-gray-700 truncate flex-1">
                                  {ps.quantity}x {ps.service.name}
                                </span>
                              </div>
                            ))
                          ) : (
                            <ul className="space-y-2">
                              {visibleServices.map((ps: any, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-sm text-gray-700">
                                    {ps.quantity}x {ps.service.name}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {remainingCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedPackages(prev => {
                                const newSet = new Set(prev)
                                if (newSet.has(pkg.id)) {
                                  newSet.delete(pkg.id)
                                } else {
                                  newSet.add(pkg.id)
                                }
                                return newSet
                              })
                            }}
                            className="w-full text-sm font-medium mt-2 flex items-center justify-center gap-1 transition-colors"
                            style={{ color: colors.primary }}
                          >
                            {expandedPackages.has(pkg.id) ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Ver menos
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                Ver {remainingCount} más servicios
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedPackage(pkg)
                          setBookingType('package')
                          setBookingStep(3) // Jump directly to customer info for packages
                          setShowBookingModal(true)
                        }}
                        className={getVisualProps('primary','md','w-full mt-auto').className}
                        style={getVisualProps('primary','md','w-full mt-auto').style}
                      >
                        {t('buyPackage')}
                      </button>
                    </div>
                  </div>
                )
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-10">
                      <button
                        onClick={() => setPackagesPage(Math.max(0, packagesPage - 1))}
                        disabled={packagesPage === 0}
                        className={`p-2 rounded-full transition-all ${
                          packagesPage === 0
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
                            onClick={() => setPackagesPage(i)}
                            className={`w-10 h-10 rounded-full font-medium transition-all ${
                              i === packagesPage
                                ? 'text-white shadow-lg transform scale-110'
                                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                            }`}
                            style={{ background: i === packagesPage ? colors.gradient : undefined }}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setPackagesPage(Math.min(totalPages - 1, packagesPage + 1))}
                        disabled={packagesPage === totalPages - 1}
                        className={`p-2 rounded-full transition-all ${
                          packagesPage === totalPages - 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {business.packages.length > perPage && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Mostrando {startIndex + 1}-{Math.min(startIndex + perPage, business.packages.length)} de {business.packages.length} paquetes
                    </p>
                  )}
                </>
              )
            })()}
          </div>
        </section>
      )}

      

      {/* Gallery Section (public) with categories and pagination */}
      {galleryItems.length > 0 && (
        <section id="gallery" className="py-2 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                {t('gallery')}
              </span>
              <h2 className={`${h2Cls} font-black mt-2 mb-2`}>
                {t('ourWork')}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {t('seeOurQuality')}
              </p>
            </div>

            {/* Category filters (sticky + horizontal scroll) */}
            {(() => {
              const configuredCategories = (business.settings?.galleryCategories || [])
                .slice()
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((c: any) => c.name)
              const derivedCategories = Array.from(new Set(
                galleryItems
                  .filter((it: any) => (it.type || 'image') === 'image')
                  .map((it: any) => it.category)
                  .filter(Boolean)
              )) as string[]
              const categories = (configuredCategories.length > 0 ? configuredCategories : derivedCategories)

              if (categories.length > 1) {
                return (
                  <div className="flex justify-center mb-8 sticky top-24 z-10">
                    <div className="inline-flex flex-wrap gap-2 p-1 bg-gray-100 rounded-full overflow-x-auto no-scrollbar max-w-full">
                      <button
                        onClick={() => { setGalleryCategory('all'); setGalleryPage(0) }}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all focus-visible:ring-2 ring-offset-2 ${
                          galleryCategory === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {t('all')}
                      </button>
                      {categories.map((category: string) => (
                        <button
                          key={category}
                          onClick={() => { setGalleryCategory(category); setGalleryPage(0) }}
                          className={`px-6 py-2 rounded-full text-sm font-medium transition-all focus-visible:ring-2 ring-offset-2 ${
                            galleryCategory === category ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
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

            {/* Gallery grid with pagination (6 per page) */}
            {(() => {
              const imagesOnly = galleryItems.filter((it: any) => (it.type || 'image') === 'image')
              const filtered = galleryCategory === 'all'
                ? imagesOnly
                : imagesOnly.filter((it: any) => (it.category || '') === galleryCategory)
              const perPage = 6
              const pages = Math.ceil((filtered.length || 0) / perPage)
              const start = galleryPage * perPage
              const pageItems = filtered.slice(start, start + perPage)

              return (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pageItems.map((item: any, idx: number) => (
                      <div key={item.id} className={`group bg-white ${radiusCls} ${shadowCls} transition-all duration-300 overflow-hidden`}>
                        <div className="h-56 overflow-hidden">
                          {(() => {
                            const { src, srcSet } = resolveGallerySources(item.url || item.id, 1000)
                            return (
                              <img
                                onClick={() => {
                                  // Open lightbox with current filtered items
                                  const imagesOnly = galleryItems.filter((it: any) => (it.type || 'image') === 'image')
                                  const filtered = galleryCategory === 'all'
                                    ? imagesOnly
                                    : imagesOnly.filter((it: any) => (it.category || '') === galleryCategory)
                                  setLightboxItems(filtered)
                                  // Calculate absolute index within filtered list
                                  const absoluteIndex = start + idx
                                  setLightboxIndex(absoluteIndex)
                                  setIsLightboxOpen(true)
                                }}
                                src={src}
                                srcSet={srcSet}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                alt={item.title || 'Gallery'}
                                className="w-full h-full object-cover cursor-zoom-in group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                                decoding="async"
                              />
                            )
                          })()}
                        </div>
                        {(item.title || item.category) && (
                          <div className="p-4">
                            <div className="flex items-center gap-2">
                              {item.category && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  {item.category}
                                </span>
                              )}
                              {item.title && (
                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                  {item.title}
                                </h3>
                              )}
                            </div>
                            {item.description && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {pages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-10">
                      <button
                        onClick={() => setGalleryPage(Math.max(0, galleryPage - 1))}
                        disabled={galleryPage === 0}
                        className={`p-2 rounded-full transition-all ${
                          galleryPage === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {paginationStyle === 'numbered' ? (
                        <div className="flex gap-2">
                          {Array.from({ length: pages }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => setGalleryPage(i)}
                              className={`w-10 h-10 rounded-full font-medium transition-all ${
                                i === galleryPage
                                  ? 'text-white shadow-lg transform scale-110'
                                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                              }`}
                              style={{ background: i === galleryPage ? colors.gradient : undefined }}
                              aria-current={i === galleryPage}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-600">{galleryPage + 1} / {pages}</span>
                      )}

                      <button
                        onClick={() => setGalleryPage(Math.min(pages - 1, galleryPage + 1))}
                        disabled={galleryPage === pages - 1}
                        className={`p-2 rounded-full transition-all ${
                          galleryPage === pages - 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {filtered.length > perPage && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Mostrando {start + 1}-{Math.min(start + perPage, filtered.length)} de {filtered.length} imágenes
                    </p>
                  )}
                </>
              )
            })()}
          </div>
        </section>
      )}

      {/* Staff Section (moved below Gallery) */}
      {displayStaff.length > 0 && (
        <section className="py-2 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                {t('team')}
              </span>
              <h2 className={`${h2Cls} font-black mt-2 mb-2`}>
                {t('ourProfessionals')}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">{t('meetOurTeam')}</p>
            </div>

            <div className={`grid gap-6 ${displayStaff.length === 1 ? 'max-w-sm mx-auto' : displayStaff.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : displayStaff.length === 3 ? 'sm:grid-cols-3 max-w-4xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
              {displayStaff.map((member: any) => (
                <div key={member.id} className="text-center group">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200">
                      {member.photo ? (
                        <img
                          src={member.photo.startsWith('data:') ? member.photo : getImageUrl(member.photo, 'avatar', 256)}
                          srcSet={member.photo.startsWith('data:') ? '' : getImageSrcSet(member.photo, 'avatar')}
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
                    {(member.rating && member.rating > 0) ? (
                      <div className="absolute bottom-0 right-1/2 translate-x-1/2 bg-white rounded-full px-3 py-1 shadow-lg flex items-center gap-1">
                        <Star className="w-4 h-4" style={{ color: colors.accent }} />
                        <span className="text-sm font-semibold">{member.rating}</span>
                      </div>
                    ) : null}
                  </div>

                  <h3 className="font-bold text-lg">{member.name}</h3>
                  {(() => {
                    if (!member.specialties) return null
                    if (member.specialties === '0' || member.specialties === 0 || member.specialties === '') return null
                    if (Array.isArray(member.specialties)) {
                      const validSpecialties = member.specialties.filter((s: any) => s && s !== '0' && s !== 0)
                      if (validSpecialties.length === 0) return null
                      return <p className="text-sm text-gray-500 mt-1">{validSpecialties.join(', ')}</p>
                    }
                    if (typeof member.specialties === 'string' && member.specialties.trim() !== '') {
                      return <p className="text-sm text-gray-500 mt-1">{member.specialties}</p>
                    }
                    return null
                  })()}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox overlay */}
      {isLightboxOpen && (
        (() => {
          // Build lightbox display items from current list using robust src resolution
          const items = lightboxItems.map((it: any) => {
            const { src } = resolveGallerySources(it.url || it.id, 1200)
            return { src, title: it.title, description: it.description }
          })
          return (
            <Lightbox
              items={items}
              index={lightboxIndex}
              onClose={() => setIsLightboxOpen(false)}
            />
          )
        })()
      )}

      {/* Reviews Section mejorada */}
      {reviews.length > 0 && (
        <section id="reviews" className="py-2 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                {t('reviewsTitle')}
              </span>
              <h2 className={`${h2Cls} font-black mt-2 mb-2`}>
                {t('whatClientsSay')}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">{t('reviewsSubtitle')}</p>
              
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
                    {`${t('basedOn')} ${reviews.length} ${t('reviewsLower')}`}
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
      <section id="contact" className="py-2 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-2">
            {/* Info */}
            <div>
              <h2 className="text-base font-bold mb-1">{t('contactInformation')}</h2>
              
              <div className="space-y-1 mb-2">
                {business.address && (
                  <a 
                    href={getGoogleMapsDirectionsUrl(business.address, business.city, business.state)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 hover:bg-white/5 p-2 -ml-2 rounded-lg transition-colors group"
                    title={t('seeRoute') + ' - Google Maps'}
                  >
                    <div className="relative">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.accent }} />
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: colors.accent }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-1">
                        {t('address')}
                        <span className="text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          ({t('seeRoute')})
                        </span>
                      </p>
                      <p className="text-gray-300 text-sm group-hover:text-white transition-colors">
                        {business.address}, {business.city}, {business.state}
                      </p>
                    </div>
                  </a>
                )}
                
                {business.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.accent }} />
                    <div>
                      <p className="font-semibold text-sm">{t('phone')}</p>
                      <p className="text-gray-300 text-sm">{business.phone}</p>
                    </div>
                  </div>
                )}
                
                {business.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.accent }} />
                    <div>
                      <p className="font-semibold text-sm">{t('email')}</p>
                      <p className="text-gray-300 text-sm">{business.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Social media */}
              <div>
                <p className="font-semibold mb-1 text-xs">{t('followUs')}</p>
                <div className="flex gap-2">
                  <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div className="flex flex-col items-end">
              <h2 className="text-base font-bold mb-1 w-full text-right">{t('schedule')}</h2>
              
              <div className="space-y-0.5 w-auto">
                {[1, 2, 3, 4, 5, 6, 0].map(day => {  // Lunes primero, Domingo último
                  const dayHours = workingHours.find((wh: any) => 
                    wh.dayOfWeek === day
                  )
                  const isToday = new Date().getDay() === day
                  
                  return (
                    <div 
                      key={day} 
                      className={`flex items-center py-0.5 px-2 rounded text-xs ${
                        isToday ? 'bg-white/10' : ''
                      }`}
                    >
                      <span className={`font-medium text-right w-20 ${isToday ? 'text-white' : 'text-gray-400'}`}>
                        {daysOfWeek[day]}
                      </span>
                <span className={`ml-4 text-right min-w-[110px] ${isToday ? (dayHours?.isActive ? '' : 'text-red-300') : (dayHours?.isActive ? 'text-gray-300' : 'text-gray-500 line-through')}`}
                  style={isToday && dayHours?.isActive ? { color: colors.accent } : undefined}>
                        {dayHours && dayHours.isActive
                          ? `${dayHours.startTime} - ${dayHours.endTime}`
                          : t('todayClosed')}
                      </span>
                    </div>
                  )
                })}
              </div>
              
              {(() => { const vp = getVisualProps('primary','sm','mt-1 text-xs'); return (
              <button
                onClick={() => setShowBookingModal(true)}
                className={vp.className}
                style={vp.style}
              >
                {t('bookAppointmentCTA')}
              </button>
              )})()}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Map Button */}
      {business.address && showDesktopFloatingDirection && (
        <div className="hidden md:block fixed bottom-20 right-4 z-40">
          <a
            href={getGoogleMapsDirectionsUrl(business.address, business.city, business.state)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
            title={t('seeRoute') + ' - Google Maps'}
          >
            <div className="relative">
              <MapPin className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
            <span className="font-medium text-sm hidden sm:inline">{t('howToGetThere')}</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      )}

      {/* Footer */}
      <footer className="py-3 text-center text-white" style={{ background: colors.gradient }}>
        <p className="text-xs">&copy; 2025 {business.name}. {t('allRightsReserved')}</p>
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
                    {bookingStep === 4 ? t('confirmation') : (bookingType === 'package' ? t('buyPackage') : t('bookAppointmentCTA'))}
                  </h2>
                  {bookingStep !== 4 && (
                    <p className="text-sm text-gray-500 mt-1">{t('stepOf3').replace('{n}', String(bookingStep))}</p>
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
                <div className={`h-1 flex-1 rounded-full transition-colors ${bookingStep >= 1 ? '' : 'bg-gray-200'}`} style={bookingStep >= 1 ? { background: colors.gradient } : undefined} />
                <div className={`h-1 flex-1 rounded-full transition-colors ${bookingStep >= 2 ? '' : 'bg-gray-200'}`} style={bookingStep >= 2 ? { background: colors.gradient } : undefined} />
                <div className={`h-1 flex-1 rounded-full transition-colors ${bookingStep >= 3 ? '' : 'bg-gray-200'}`} style={bookingStep >= 3 ? { background: colors.gradient } : undefined} />
                {bookingStep === 4 && (
                  <div className="h-1 flex-1 rounded-full" style={{ background: colors.accent }} />
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
                      {t('whatWouldYouLikeToDo')}
                    </label>
                    <div className={`grid gap-3 ${business.packages?.length > 0 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
                      <button
                        onClick={() => setBookingType('service')}
                        className={`p-4 rounded-xl border-2 transition-all ${bookingType === 'service' ? '' : 'border-gray-200 hover:border-gray-300'}`}
                        style={bookingType === 'service' ? { borderColor: colors.primary, background: '#ffffff' } : undefined}
                      >
                        <Calendar className="w-6 h-6 mx-auto mb-2" 
                          color={bookingType === 'service' ? '#3B82F6' : '#9CA3AF'} />
                        <p className="font-semibold">{t('bookService') || 'Book Service'}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('payOnArrival')}</p>
                      </button>
                      
                      {/* Solo mostrar opciones de paquetes si el negocio tiene paquetes */}
                      {business.packages?.length > 0 && (
                      <>
                      <button
                        onClick={async () => {
                          setBookingType('use-package')
                          
                          // Si el usuario está logueado, cargar sus paquetes automáticamente
                          if (isAuthenticated && clientData?.email) {
                            setBookingData(prev => ({ ...prev, customerEmail: clientData.email }))
                            setIsLoadingPackages(true)
                            
                            try {
                              const response = await fetch('/api/cliente/dashboard', {
                                credentials: 'include' // Use cookies instead of token
                              })
                              
                              if (response.ok) {
                                const data = await response.json()
                                if (data.packages && data.packages.length > 0) {
                                  setCustomerPackages(data.packages)
                                  setHasSearchedPackages(true)
                                  setBookingStep(1.5) // Ir a selección de paquete
                                } else {
                                  toast(t('noActivePackages'), 'info')
                                  setBookingType('package') // Cambiar a comprar paquete
                                }
                              }
                            } catch (error) {
                              console.error('Error loading packages:', error)
                            } finally {
                              setIsLoadingPackages(false)
                            }
                          } else {
                            // Si no está logueado, preguntar si desea iniciar sesión
                            const ok = await confirm({
                              title: t('login') || 'Login',
                              message: t('mustSignInUsePackages'),
                              confirmText: t('login') || 'Login'
                            })
                            if (ok) {
                              const currentUrl = encodeURIComponent(window.location.href)
                              window.location.href = `/cliente/login?from=${currentUrl}`
                            } else {
                              // Volver al tipo de reserva normal si el usuario cancela
                              setBookingType('service')
                            }
                          }
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${bookingType === 'use-package' ? '' : 'border-gray-200 hover:border-gray-300'}`}
                        style={bookingType === 'use-package' ? { borderColor: colors.accent, background: '#ffffff' } : undefined}
                      >
                        <Gift className="w-6 h-6 mx-auto mb-2" 
                          color={bookingType === 'use-package' ? '#10B981' : '#9CA3AF'} />
                        <p className="font-semibold">{t('useMyPackage')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('iHaveSessions')}</p>
                      </button>
                      
                      <button
                        onClick={() => setBookingType('package')}
                        className={`p-4 rounded-xl border-2 transition-all ${bookingType === 'package' ? '' : 'border-gray-200 hover:border-gray-300'}`}
                        style={bookingType === 'package' ? { borderColor: colors.accent, background: '#ffffff' } : undefined}
                      >
                        <Package className="w-6 h-6 mx-auto mb-2" 
                          color={bookingType === 'package' ? '#8B5CF6' : '#9CA3AF'} />
                        <p className="font-semibold">{t('buyPackage')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('specialOffersLower')}</p>
                      </button>
                      </>
                      )}
                    </div>
                  </div>

                  {/* Lista de servicios o paquetes normal */}
                  {bookingType !== 'use-package' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      {bookingType === 'package' ? t('selectAPackage') : t('selectAService')}
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
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                style={selectedCategory === 'all' ? { background: colors.primary } : undefined}
                              >
                                {t('all')}
                              </button>
                              {categories.map((category) => (
                                <button
                                  key={category}
                                  onClick={() => setSelectedCategory(category)}
                                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                  style={selectedCategory === category ? { background: colors.primary } : undefined}
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
                                    className={`w-full text-left p-4 rounded-xl transition-all mb-2 ${selectedService?.id === service.id ? 'border-2' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}`}
                                    style={selectedService?.id === service.id ? { borderColor: colors.primary, background: '#fff' } : undefined}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-semibold">{service.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                          {service.duration} minutos
                                        </p>
                                      </div>
                                      <p className="font-bold text-lg">{formatCurrency(service.price)}</p>
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
                                className={`w-full text-left p-4 rounded-xl transition-all ${selectedService?.id === service.id ? 'border-2' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}`}
                                style={selectedService?.id === service.id ? { borderColor: colors.primary, background: '#fff' } : undefined}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">{service.name}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {service.duration} minutos
                                    </p>
                                  </div>
                                  <p className="font-bold text-lg">{formatCurrency(service.price)}</p>
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
                            className={`w-full text-left p-4 rounded-xl transition-all ${selectedPackage?.id === pkg.id ? 'border-2' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}`}
                            style={selectedPackage?.id === pkg.id ? { borderColor: colors.accent, background: '#fff' } : undefined}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{pkg.name}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {pkg.sessionCount} sesiones • Válido {pkg.validityDays} días
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">{formatCurrency(pkg.price)}</p>
                                {pkg.originalPrice && (
                                  <p className="text-sm text-gray-400 line-through">
                                    {formatCurrency(pkg.originalPrice)}
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
                    {t('back')}
                  </button>
                  
                  {/* Solicitar email si no lo tiene */}
                  {!bookingData.customerEmail && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <p className="font-semibold text-green-800 mb-3">
                        {t('enterEmailToViewPackages')}
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
                      <p className="text-gray-600 mt-2">{t('searchingYourPackages')}</p>
                    </div>
                  )}
                  
                  {/* Mostrar paquetes disponibles si ya ingresó email */}
                  {bookingData.customerEmail && !isLoadingPackages && customerPackages.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Tus paquetes disponibles
                      </label>
                      <div className="space-y-1">
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
                        <div className="mt-6 space-y-4">
                          <h4 className="font-semibold text-gray-700">{t('selectTheServiceToBook')}</h4>
                          <div className="grid gap-3">
                            {selectedCustomerPackage.package.services.map((pkgService: any) => (
                              <button
                                key={pkgService.service.id}
                                onClick={() => {
                                  // Buscar el servicio completo en la lista de servicios
                                  const fullService = business.services?.find((s: any) => s.id === pkgService.service.id || s.id === pkgService.serviceId)
                                  console.log('Buscando servicio:', {
                                    pkgServiceId: pkgService.service?.id || pkgService.serviceId,
                                    availableServices: business.services?.map((s: any) => ({ id: s.id, name: s.name })) || [],
                                    found: fullService
                                  })
                                  if (fullService) {
                                    setSelectedService(fullService)
                                    setBookingStep(2)
                                  } else {
                                    toast('Error: No se pudo encontrar el servicio. Por favor, recarga la página.', 'error')
                                  }
                                }}
                                className="p-4 rounded-xl border-2 transition-all text-left"
                                style={{ borderColor: '#e5e7eb' }}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-semibold">{pkgService.service.name}</p>
                                    <p className="text-sm text-gray-500">
                                      Duración: {pkgService.service.duration} min
                                    </p>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Mensaje si no tiene paquetes - solo mostrar después de buscar */}
                  {bookingData.customerEmail && !isLoadingPackages && hasSearchedPackages && customerPackages.length === 0 && (
                    <div className="rounded-xl p-4 text-center" style={{ background: '#FFFBEB', border: `2px solid ${colors.accent}` }}>
                      <p className="font-semibold mb-2" style={{ color: colors.accent }}>
                        No encontramos paquetes activos
                      </p>
                      <p className="text-sm mb-3" style={{ color: colors.accent }}>
                        {t('noPackagesWithEmail')}
                      </p>
                      <button
                        onClick={() => {
                          setBookingType('package')
                          setBookingStep(1)
                        }}
                        className="text-sm font-medium"
                        style={{ color: colors.accent }}
                      >
                        {t('wantToBuyPackage')}
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
                    {t('back')}
                  </button>

                  {/* Staff Selection - Solo mostrar si el módulo está habilitado y hay staff */}
                  {staffModuleEnabled && staff.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        {t('professionalOptional')}
                      </label>
                      
                      <div className="space-y-2">
                        {/* Opción "Cualquier disponible" */}
                        <div
                          onClick={() => setSelectedStaff(null)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            !selectedStaff ? '' : 'border-gray-200'
                          }`}
                          style={!selectedStaff ? { borderColor: colors.primary, background: '#fff' } : undefined}
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Cualquier disponible</p>
                            <p className="text-sm text-gray-500">Se asignará automáticamente</p>
                          </div>
                          {!selectedStaff && (
                            <Check size={20} style={{ color: colors.primary }} />
                          )}
                        </div>
                        
                        {/* Lista de trabajadores */}
                        {staff.map((s: any) => (
                          <div
                            key={s.id}
                            onClick={() => setSelectedStaff(s)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedStaff?.id === s.id ? '' : 'border-gray-200'}`}
                            style={selectedStaff?.id === s.id ? { borderColor: colors.primary, background: '#fff' } : undefined}
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                              {s.photo ? (
                                <img
                                  src={s.photo.startsWith('data:') ? s.photo : getImageUrl(s.photo, 'avatar', 128)}
                                  alt={s.name}
                                  className="w-full h-full object-cover object-center"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User size={20} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                            
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
                            
                            {selectedStaff?.id === s.id && (
                              <Check size={20} style={{ color: colors.primary }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                              className={`px-4 py-3 rounded-xl font-medium transition-all ${selectedTime === slot ? 'text-white' : ''}`}
                              style={selectedTime === slot ? { background: colors.primary } : { background: '#f3f4f6' }}
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
                    {t('back')}
                    </button>

                  {/* Resumen */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">{t('bookingSummaryTitle')}</p>
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {selectedService?.name || selectedPackage?.name}
                      </p>
                      {bookingType === 'service' && (
                        <>
                          <p className="text-sm text-gray-600">
                            📅 {selectedDate} {t('at') || 'at'} {selectedTime}
                          </p>
                          {selectedStaff && (
                            <p className="text-sm text-gray-600">
                              👤 {t('withLabel') || 'With'} {selectedStaff.name}
                            </p>
                          )}
                        </>
                      )}
                      <p className="font-bold text-lg mt-2">
                        {bookingType === 'service' && usePackageSession ? (
                          <>
                            <span className="line-through text-gray-400">{formatCurrency(selectedService?.price)}</span>
                            <span className="ml-2 text-green-600">{t('packageUsedFree')}</span>
                          </>
                        ) : (
                          <>
                            {t('totalLabel') || 'Total:'} {formatCurrency(selectedService?.price || selectedPackage?.price)}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Campos del formulario */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {t('fullName')} *
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
                        {t('phoneLabel')} *
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
                    <div className="rounded-xl p-4" style={{ background: '#ecfdf5', border: `2px solid ${colors.accent}` }}>
                      <p className="font-semibold mb-3" style={{ color: colors.accent }}>🎉 {t('youHavePackages')}</p>
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
                              {t('noneOfPackagesInclude')}
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
                        placeholder={t('anySpecialRequest')}
                      />
                    </div>
                  </div>

                  {(() => { const vp = getVisualProps('primary','md','w-full'); return (
                  <button
                    type="submit"
                    className={vp.className}
                    style={vp.style}
                  >
                    {bookingType === 'package' ? t('confirmPurchase') : t('confirmBookingShort')}
                  </button>
                  )})()}
                  
                  <p className="text-xs text-center text-gray-500">
                    {t('acceptTerms')}
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
                      {bookingType === 'package' ? t('packageReservationRecorded') : t('reservationConfirmedTitle')}
                    </h3>
                    {bookingType === 'package' ? (
                      <>
                        <p className="text-gray-600 mb-3">{t('reservationPendingPayment')}</p>
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-left">
                          <p className="text-sm text-yellow-800">
                            <strong>{t('nextStepsLabel')}</strong>
                          </p>
                          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                            {bookingData.paymentMethod === 'TRANSFER' ? (
                              <>
                                <li>• {t('makeBankTransfer')}</li>
                                <li>• {t('sendReceiptToBusiness')}</li>
                                <li>• {t('waitPaymentConfirmation')}</li>
                              </>
                            ) : (
                              <>
                                <li>• {t('visitBusinessToPayCash')}</li>
                                <li>• {t('oncePaymentConfirmedActivated')}</li>
                              </>
                            )}
                            <li>• {t('youWillReceiveEmailWhenActive')}</li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-600">{t('weSentEmailReservationDetails')}</p>
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
                            <span className="text-gray-600">{t('dateLabel')}</span>
                            <span className="font-medium">{lastBookingDetails?.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('timeLabel')}</span>
                            <span className="font-medium">{lastBookingDetails?.time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('professionalLabel')}</span>
                            <span className="font-medium">{lastBookingDetails?.staff}</span>
                          </div>
                        </>
                      )}
                      {bookingType === 'package' && selectedPackage && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('includedSessions')}:</span>
                          <span className="font-medium">{selectedPackage.sessionCount || 1}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('customer')}:</span>
                        <span className="font-medium">{lastBookingDetails?.customerName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3">
                    {(() => { const vp = getVisualProps('primary','md','flex-1'); return (
                    <button
                      onClick={() => {
                        resetBookingForm()
                      }}
                      className={vp.className}
                      style={vp.style}
                    >
                      {bookingType === 'package' ? t('buyAnotherPackage') : t('makeAnotherReservation')}
                    </button>
                    )})()}
                    {(() => { const vp = getVisualProps('secondary','md','flex-1'); return (
                    <button
                      onClick={() => {
                        setShowBookingModal(false)
                        resetBookingForm()
                      }}
                      className={vp.className}
                      style={vp.style}
                    >
                      {t('close')}
                    </button>
                    )})()}
                  </div>

                  <p className="text-xs text-gray-500">
                    {t('reminder24h')}
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
                  {loginMode === 'login' ? t('signIn') : t('createAccount')}
                </h2>
                <button
                  onClick={() => {
                    setShowLoginModal(false)
                    setLoginError('')
                    setIsLoggingIn(false)
                    setLoginForm({ email: '', password: '', name: '', phone: '' })
                    setVerificationCode('')
                    setVerificationSent(false)
                    setLoginMode('login')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loginError && (
                <>
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-red-700 text-sm font-medium">{loginError}</p>
                      </div>
                    </div>
                  </div>
                  {loginMode === 'login' && (loginError.toLowerCase().includes('credenciales') || loginError.toLowerCase().includes('contraseña') || loginError.toLowerCase().includes('bloqueada')) && (
                    <div className="text-right mb-4">
                      <a 
                        href="/cliente/forgot-password" 
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {t('forgotPasswordQuestion')}
                      </a>
                    </div>
                  )}
                </>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {loginMode === 'verify' ? (
                  // Verification code input
                  <>
                    <div className="text-center mb-3">
                      <p className="text-gray-600">{t('weSentVerificationTo')}</p>
                      <p className="font-semibold">{loginForm.email}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {t('otpReactivateHint') || 'If you already had an account, this code will sign you in and re‑add this business to your portal.'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('verificationCodeLabel')}</label>
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
                    {(() => { const vp = getVisualProps('primary','md','w-full disabled:opacity-50'); return (
                    <button
                      type="submit"
                      disabled={isLoggingIn || verificationCode.length !== 6}
                      className={vp.className}
                      style={vp.style}
                    >
                      {isLoggingIn ? t('verifying') : t('verifyCode')}
                    </button>
                    )})()}
                    {(() => { const vp = getVisualProps('secondary','sm','w-full'); return (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode('register')
                        setVerificationSent(false)
                        setVerificationCode('')
                        setLoginError('')
                      }}
                      className={vp.className}
                      style={vp.style}
                    >
                      ← {t('back')}
                    </button>
                    )})()}
                  </>
                ) : (
                  // Regular login/register form
                  <>
                    {loginMode === 'register' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('fullName')}
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
                        {t('password')}
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
                          {t('phoneOptional')}
                        </label>
                        <input
                          type="tel"
                          value={loginForm.phone}
                          onChange={(e) => setLoginForm({...loginForm, phone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {(() => { const vp = getVisualProps('primary','md','w-full disabled:opacity-50'); return (
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className={vp.className}
                      style={vp.style}
                    >
                      {isLoggingIn
                        ? t('processing')
                        : (loginMode === 'login'
                            ? (t('signInBtn') || t('signIn'))
                            : t('sendVerificationCode'))}
                    </button>
                    )})()}
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
                    {loginMode === 'login'
                      ? `${t('dontHaveAccount')} ${t('signUp')}`
                      : `${t('alreadyHaveAccount')} ${t('signIn')}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky CTA bar */}
      {showMobileStickyCTA && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40">
          <div className="mx-3 mb-3 rounded-2xl shadow-lg flex overflow-hidden" style={{ background: colors.gradient }}>
            <button
              onClick={() => setShowBookingModal(true)}
              className="flex-1 py-3 text-white font-semibold"
            >
              {t('bookShort')}
            </button>
            {business.phone && (
              <a
                href={`tel:${(business.phone || '').replace(/\s|\(|\)|-/g,'')}`}
                className="flex-1 py-3 text-white/90 font-medium text-center border-l border-white/20"
              >
                {t('phone')}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">{t('doYouWantLeaveNote')}</h3>
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                  setAppointmentToCancel(null)
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">{t('optionalNoteInfo')}</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('writeNoteOptional')}
                className="w-full min-h-28 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
                  <div className="flex gap-2 pt-2">
                    {(() => { const vp = getVisualProps('secondary','md','flex-1'); return (
                    <button
                      onClick={() => {
                        setShowCancelModal(false)
                        setCancelReason('')
                        setAppointmentToCancel(null)
                      }}
                      className={vp.className}
                      style={vp.style}
                    >
                      {t('close')}
                    </button>
                    )})()}
                    {(() => { const vp = getVisualProps('primary','md','flex-1 disabled:opacity-50'); return (
                    <button
                      onClick={confirmCancelAppointment}
                      disabled={isCancelling}
                      className={vp.className}
                      style={vp.style}
                    >
                      {isCancelling ? t('cancelling') : t('confirmCancellation')}
                    </button>
                    )})()}
                  </div>
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
  );
  return __jsx_root
}// Force reload










