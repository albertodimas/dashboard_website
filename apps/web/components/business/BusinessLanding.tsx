'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Star, 
  Calendar,
  Check,
  CheckCircle,
  ChevronRight,
  Menu,
  X,
  Package,
  User,
  ChevronLeft,
  Grid3X3,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react'
import { formatPrice, formatCurrency, formatDiscount } from '@/lib/format-utils'

interface BusinessLandingProps {
  business: any
}

export default function BusinessLanding({ business }: BusinessLandingProps) {
  // Debug log
  console.log('[CLIENT BusinessLanding] Received business data:', {
    hasReviews: !!business.reviews,
    reviewsLength: business.reviews?.length || 0,
    hasGalleryItems: !!business.galleryItems,
    galleryItemsLength: business.galleryItems?.length || 0,
    hasStaff: !!business.staff,
    staffLength: business.staff?.length || 0,
    hasWorkingHours: !!business.workingHours,
    workingHoursLength: business.workingHours?.length || 0
  })
  
  const theme = business.settings?.theme || {}
  const colors = {
    primary: theme.primaryColor || '#3B82F6',
    secondary: theme.secondaryColor || '#1F2937',
    accent: theme.accentColor || '#10B981',
    background: theme.backgroundColor || '#FFFFFF'
  }
  const fontFamily = theme.fontFamily || 'inter'
  const buttonStyle = theme.buttonStyle || 'rounded'
  
  // Font family mapping
  const fontFamilyClasses: Record<string, string> = {
    inter: 'font-sans',
    playfair: 'font-serif',
    montserrat: 'font-sans',
    roboto: 'font-sans',
    poppins: 'font-sans',
    lato: 'font-sans'
  }
  
  // Button style mapping
  const getButtonClasses = (baseClasses: string = '') => {
    const styleClasses = {
      rounded: 'rounded-lg',
      square: 'rounded-none',
      pill: 'rounded-full',
      gradient: 'rounded-lg',
      'soft-rounded': 'rounded-2xl',
      outlined: 'rounded-lg',
      shadow: 'rounded-lg shadow-lg',
      '3d': 'rounded-lg'
    }
    return `${baseClasses} ${styleClasses[buttonStyle] || styleClasses.rounded}`
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showPackageReserveModal, setShowPackageReserveModal] = useState(false)
  const [bookingStep, setBookingStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [selectedPackageForPurchase, setSelectedPackageForPurchase] = useState<any>(null)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [availableStaff, setAvailableStaff] = useState<any[]>(business.staff || [])
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [selectedImageModal, setSelectedImageModal] = useState<any>(null)
  const [activeGalleryTab, setActiveGalleryTab] = useState('All')
  const [reviews, setReviews] = useState<any[]>(business.reviews || [])
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [reservationData, setReservationData] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'TRANSFER',
    notes: ''
  })
  const [customerPackages, setCustomerPackages] = useState<any[]>([])
  const [customerSession, setCustomerSession] = useState<any>(null)

  // Check for customer session on mount
  useEffect(() => {
    checkCustomerSession()
    // fetchReviews() - Reviews ya vienen con los datos del business
    if (business.galleryItems?.length > 0) {
      const categories = ['All', ...new Set(business.galleryItems.map((item: any) => item.category || 'General'))]
      setActiveGalleryTab(categories[0] || 'All')
    }
  }, [])

  // Fetch slots when date and service change
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedService, selectedStaff])

  const checkCustomerSession = async () => {
    try {
      const response = await fetch('/api/client/packages')
      if (response.ok) {
        const data = await response.json()
        setCustomerSession(data.customer)
        // Filter packages for this business
        const businessPackages = data.packages?.filter(
          (pkg: any) => pkg.businessId === business.id && pkg.status === 'ACTIVE' && pkg.remainingSessions > 0
        ) || []
        setCustomerPackages(businessPackages)
      }
    } catch (error) {
      console.error('Error checking customer session:', error)
    }
  }

  const fetchReviews = async () => {
    if (!business?.id) return
    setIsLoadingReviews(true)
    try {
      const response = await fetch(`/api/public/reviews?businessId=${business.id}`)
      const data = await response.json()
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    } finally {
      setIsLoadingReviews(false)
    }
  }

  const fetchAvailableSlots = async () => {
    setIsLoadingSlots(true)
    try {
      const params = new URLSearchParams({
        businessId: business.id,
        serviceId: selectedService.id,
        date: selectedDate
      })
      if (selectedStaff) {
        params.append('staffId', selectedStaff.id)
      }
      
      const response = await fetch(`/api/public/appointments/slots?${params.toString()}`)
      const data = await response.json()
      setAvailableSlots(data.availableSlots || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      setAvailableSlots([])
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const fetchStaffForService = async (serviceId: string) => {
    try {
      const businessIdentifier = business.customSlug || business.slug || business.id
      const url = `/api/public/staff/${encodeURIComponent(businessIdentifier)}?serviceId=${serviceId}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAvailableStaff(data.staff || [])
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      setAvailableStaff([])
    }
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const appointmentData: any = {
        businessId: business.id,
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        ...bookingData
      }
      
      // If customer has a package selected, include it
      if (selectedPackage) {
        appointmentData.packagePurchaseId = selectedPackage.id
        appointmentData.usePackageSession = true
      }
      
      if (selectedStaff) {
        appointmentData.staffId = selectedStaff.id
      }
      
      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      })

      if (response.ok) {
        const result = await response.json()
        setBookingSuccess(true)
        setBookingStep(5) // Success step
        // Refresh customer packages if a session was used
        if (selectedPackage) {
          await checkCustomerSession()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePackageReserve = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/public/packages/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackageForPurchase?.id,
          customerName: reservationData.name,
          customerEmail: reservationData.email,
          customerPhone: reservationData.phone,
          paymentMethod: reservationData.paymentMethod,
          notes: reservationData.notes
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Package reserved successfully! ${result.purchase.paymentInstructions?.message || 'Please complete payment to activate.'}`)
        setReservationData({
          name: '',
          email: '',
          phone: '',
          paymentMethod: 'TRANSFER',
          notes: ''
        })
        setShowPackageReserveModal(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to reserve package')
      }
    } catch (error) {
      console.error('Reservation error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatWorkingHours = (hours: any[]) => {
    const daysMap: any = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday'
    }
    
    if (!hours || hours.length === 0) {
      return [{ days: 'Monday - Friday', time: '09:00 - 17:00' }]
    }
    
    return hours.map(h => ({
      days: daysMap[h.dayOfWeek] || 'Day',
      time: h.isActive ? `${h.startTime || '09:00'} - ${h.endTime || '17:00'}` : 'Closed'
    }))
  }

  const workingHours = formatWorkingHours(business.workingHours || [])

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
      sourcesans: '"Source Sans Pro", sans-serif'
    }
    return { fontFamily: fontMap[fontFamily] || fontMap.inter }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white" style={getFontFamilyStyle()}>
      {/* Header */}
      <header className="fixed top-0 w-full backdrop-blur-md bg-white/80 border-b border-gray-100 z-50">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/business/${business.slug}`} className="text-3xl font-black tracking-tight" style={{ color: colors.primary }}>
              {business.name}
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-gray-700 hover:text-gray-900 font-medium transition">Services</a>
              {business.packages?.length > 0 && (
                <a href="#packages" className="text-gray-700 hover:text-gray-900 font-medium transition">Packages</a>
              )}
              {business.galleryItems?.length > 0 && (
                <a href="#gallery" className="text-gray-700 hover:text-gray-900 font-medium transition">Gallery</a>
              )}
              {reviews.length > 0 && (
                <a href="#reviews" className="text-gray-700 hover:text-gray-900 font-medium transition">Reviews</a>
              )}
              <a href="#contact" className="text-gray-700 hover:text-gray-900 font-medium transition">Contact</a>
              {customerSession && customerPackages.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {customerPackages.reduce((sum, pkg) => sum + pkg.remainingSessions, 0)} sessions
                </span>
              )}
              {customerSession && (
                <Link href="/client/portal" className="text-sm text-blue-600 hover:text-blue-700">
                  My Portal
                </Link>
              )}
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
              >
                Book Now
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="container mx-auto px-6 py-4 space-y-4">
              <a href="#services" className="block py-2 text-gray-700">Services</a>
              {business.packages?.length > 0 && (
                <a href="#packages" className="block py-2 text-gray-700">Packages</a>
              )}
              {business.galleryItems?.length > 0 && (
                <a href="#gallery" className="block py-2 text-gray-700">Gallery</a>
              )}
              {reviews.length > 0 && (
                <a href="#reviews" className="block py-2 text-gray-700">Reviews</a>
              )}
              <a href="#contact" className="block py-2 text-gray-700">Contact</a>
              {customerSession && (
                <>
                  {customerPackages.length > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {customerPackages.reduce((sum, pkg) => sum + pkg.remainingSessions, 0)} sessions
                    </span>
                  )}
                  <Link href="/client/portal" className="block py-2 text-blue-600">
                    My Portal
                  </Link>
                </>
              )}
              <button
                onClick={() => {
                  setShowBookingModal(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full px-6 py-2.5 rounded-xl font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
              >
                Book Now
              </button>
            </div>
          </div>
        )}
      </header>
      
      {/* Hero Section with Cover Image */}
      <section className="relative h-[60vh] min-h-[500px] pt-20">
        <div className="absolute inset-0">
          {business.coverImage ? (
            <img 
              src={business.coverImage} 
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.accent}20 100%)` 
              }}
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative h-full flex items-center justify-center text-center px-6">
          <div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-lg">
              {business.name}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
              {business.description || 'Professional services for you'}
            </p>
            
            {/* Customer packages alert */}
            {customerPackages.length > 0 && (
              <div className="bg-green-500/90 backdrop-blur-md text-white rounded-lg p-4 mb-8 max-w-md mx-auto">
                <div className="flex items-center justify-center">
                  <Package className="w-5 h-5 mr-2" />
                  <p className="font-medium">
                    You have {customerPackages.reduce((sum, pkg) => sum + pkg.remainingSessions, 0)} sessions available!
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  setShowBookingModal(true)
                  setBookingStep(1)
                }}
                className="inline-flex items-center px-8 py-3 text-lg font-semibold text-white rounded-full hover:scale-105 transition-all shadow-xl"
                style={{ backgroundColor: colors.primary }}
              >
                Book Appointment
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
              {business.packages?.length > 0 && (
                <button
                  onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center px-8 py-3 text-lg font-semibold text-white rounded-full hover:scale-105 transition-all shadow-xl bg-yellow-500"
                >
                  View Packages
                  <Package className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {business.stats && (
        <section className="py-8 bg-white border-b">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {business.stats.completedAppointments || 0}+
                </p>
                <p className="text-gray-600">Happy Customers</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {business.stats.averageRating?.toFixed(1) || '5.0'}
                </p>
                <div className="flex justify-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="w-5 h-5" 
                      fill={i < Math.round(business.stats?.averageRating || 5) ? colors.accent : 'none'}
                      color={colors.accent}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {business.services?.length || 0}
                </p>
                <p className="text-gray-600">Services</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12" style={{ color: colors.primary }}>
            Our Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {business.services?.map((service: any) => (
              <div key={service.id} className="border rounded-lg p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                    ${service.price}
                  </span>
                  <span className="text-sm text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {service.duration} min
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedService(service)
                    setShowBookingModal(true)
                    setBookingStep(1)
                  }}
                  className="mt-4 w-full py-2 rounded-lg text-white font-medium hover:opacity-90 transition"
                  style={{ backgroundColor: colors.accent }}
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      {business.packages?.length > 0 && (
        <section id="packages" className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12" style={{ color: colors.primary }}>
              Package Deals
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {business.packages?.map((pkg: any) => (
                <div key={pkg.id} className="bg-white shadow-lg rounded-xl overflow-hidden flex flex-col h-full">
                  {/* Discount Banner */}
                  {pkg.discount && pkg.discount > 0 && (
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-2">
                      <span className="font-bold text-sm">{Math.round(pkg.discount)}% OFF</span>
                    </div>
                  )}
                  
                  <div className="p-6 flex flex-col flex-1">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {pkg.description || 'Special package offer'}
                    </p>
                    
                    {/* Price Section */}
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                            <span className="text-sm text-gray-500 line-through block">
                              {formatCurrency(pkg.originalPrice)}
                            </span>
                          )}
                          <span className="text-3xl font-bold" style={{ color: colors.primary }}>
                            {formatCurrency(pkg.price)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-700">{pkg.sessionCount || 1}</div>
                          <div className="text-xs text-gray-500">sessions</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Package Details */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{pkg.duration} min</span>
                      </div>
                      {pkg.validityDays && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{pkg.validityDays} days</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Services List - Grid Layout when expanded */}
                    {pkg.services && pkg.services.length > 0 && (
                      <div className="border-t pt-4 mb-4 flex-1">
                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                          Included Services
                        </p>
                        <div className={`${expandedPackages.has(pkg.id) 
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48' 
                          : 'space-y-1 max-h-24'} overflow-y-auto custom-scrollbar transition-all duration-300`}>
                          {(expandedPackages.has(pkg.id) ? pkg.services : pkg.services.slice(0, 3)).map((ps: any) => (
                            <div key={ps.serviceId} className={`flex items-center justify-between text-sm ${
                              expandedPackages.has(pkg.id) ? 'bg-gray-50 rounded-lg p-2' : ''
                            }`}>
                              <span className="text-gray-600 truncate flex-1 text-xs">{ps.service?.name}</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">
                                {ps.quantity}x
                              </span>
                            </div>
                          ))}
                        </div>
                        {pkg.services.length > 3 && (
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
                            className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium pt-2 flex items-center justify-center gap-1 transition-colors"
                          >
                            {expandedPackages.has(pkg.id) ? (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Show less
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                Show {pkg.services.length - 3} more services
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Purchase Button */}
                    <button
                      onClick={() => {
                        setSelectedPackageForPurchase(pkg)
                        setShowPackageReserveModal(true)
                      }}
                      className={getButtonClasses("w-full py-3 text-white font-medium hover:opacity-90 transition mt-auto")}
                      style={{ 
                        background: buttonStyle === 'gradient'
                          ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`
                          : colors.accent
                      }}>
                      Purchase Package
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {business.galleryItems?.length > 0 && (
        <section id="gallery" className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12" style={{ color: colors.primary }}>
              Gallery
            </h2>
            
            {/* Category Tabs */}
            <div className="flex justify-center mb-8 gap-2 flex-wrap">
              {['All', ...new Set(business.galleryItems.map((item: any) => item.category || 'General'))].map((category: any) => (
                <button
                  key={category}
                  onClick={() => setActiveGalleryTab(category)}
                  className={`px-4 py-2 rounded-full font-medium transition ${
                    activeGalleryTab === category
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={activeGalleryTab === category ? { backgroundColor: colors.primary } : {}}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {business.galleryItems
                .filter((item: any) => activeGalleryTab === 'All' || (item.category || 'General') === activeGalleryTab)
                .map((item: any, index: number) => (
                  <div 
                    key={index} 
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition"
                    onClick={() => setSelectedImageModal(item)}
                  >
                    <img
                      src={item.url || item.imageUrl}
                      alt={item.title || 'Gallery image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section id="reviews" className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12" style={{ color: colors.primary }}>
              Customer Reviews
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map((review: any) => (
                <div key={review.id} className="bg-white rounded-lg p-6 shadow">
                  <div className="flex items-center mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5"
                          fill={i < review.rating ? colors.accent : 'none'}
                          color={colors.accent}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{review.comment}</p>
                  <p className="text-sm text-gray-500">- {review.customer?.name || 'Customer'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12" style={{ color: colors.primary }}>
            Contact Us
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <MapPin size={40} className="mx-auto mb-4" style={{ color: colors.primary }} />
              <h3 className="font-semibold mb-2">Address</h3>
              <p className="text-gray-600">
                {business.address}<br />
                {business.city}, {business.state} {business.postalCode}
              </p>
            </div>
            <div className="text-center">
              <Phone size={40} className="mx-auto mb-4" style={{ color: colors.primary }} />
              <h3 className="font-semibold mb-2">Phone</h3>
              <p className="text-gray-600">{business.phone}</p>
            </div>
            <div className="text-center">
              <Mail size={40} className="mx-auto mb-4" style={{ color: colors.primary }} />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-gray-600">{business.email}</p>
            </div>
          </div>

          {/* Working Hours */}
          {workingHours.length > 0 && (
            <div className="mt-12 text-center">
              <h3 className="text-xl font-semibold mb-4">Working Hours</h3>
              <div className="space-y-2">
                {workingHours.map((schedule, index) => (
                  <div key={index} className="text-gray-600">
                    <span className="font-medium">{schedule.days}:</span> {schedule.time}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Book Appointment</h2>
                <button
                  onClick={() => {
                    setShowBookingModal(false)
                    setBookingStep(1)
                    setSelectedService(null)
                    setSelectedPackage(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              {/* Progress Indicator */}
              <div className="flex gap-2 mt-4">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-2 flex-1 rounded-full ${
                      bookingStep >= step ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Step 1: Select Service */}
              {bookingStep === 1 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select a Service</h3>
                  
                  {/* Show package session options if customer has packages */}
                  {customerPackages.length > 0 && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-800 mb-3">Use Your Package Sessions</p>
                      <div className="space-y-2">
                        {customerPackages.map((pkg) => (
                          <label key={pkg.id} className="flex items-center p-3 bg-white rounded-lg cursor-pointer hover:bg-green-100">
                            <input
                              type="radio"
                              name="package"
                              value={pkg.id}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPackage(pkg)
                                  // Auto-select the first service from the package
                                  const service = pkg.package?.services?.[0]?.service
                                  if (service) {
                                    setSelectedService(service)
                                  }
                                }
                              }}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{pkg.package?.name}</p>
                              <p className="text-sm text-gray-600">
                                {pkg.remainingSessions} sessions remaining
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    {business.services?.map((service: any) => (
                      <div
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service)
                          setBookingStep(2)
                          if (business.enableStaffModule) {
                            fetchStaffForService(service.id)
                          }
                        }}
                        className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-gray-600">{service.duration} minutes</p>
                          </div>
                          <span className="text-xl font-bold" style={{ color: colors.primary }}>
                            ${service.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Select Date & Time */}
              {bookingStep === 2 && (
                <div>
                  <button
                    onClick={() => setBookingStep(1)}
                    className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft size={20} className="mr-1" />
                    Back
                  </button>
                  
                  <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
                  
                  {selectedService && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{selectedService.name}</p>
                      <p className="text-sm text-gray-600">{selectedService.duration} minutes - ${selectedService.price}</p>
                      {selectedPackage && (
                        <p className="text-sm text-green-600 mt-1">
                          Using package session ({selectedPackage.remainingSessions} remaining)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Staff Selection (if enabled) */}
                  {business.enableStaffModule && availableStaff.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Professional (Optional)
                      </label>
                      <select
                        value={selectedStaff?.id || ''}
                        onChange={(e) => {
                          const staff = availableStaff.find(s => s.id === e.target.value)
                          setSelectedStaff(staff || null)
                        }}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Any Available</option>
                        {availableStaff.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Date
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Times
                      </label>
                      {isLoadingSlots ? (
                        <p className="text-gray-500">Loading available times...</p>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => {
                                setSelectedTime(slot)
                                setBookingStep(3)
                              }}
                              className="px-4 py-2 border rounded-lg hover:bg-blue-50 hover:border-blue-500 transition"
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No available times for this date</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Customer Information */}
              {bookingStep === 3 && (
                <div>
                  <button
                    onClick={() => setBookingStep(2)}
                    className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft size={20} className="mr-1" />
                    Back
                  </button>
                  
                  <h3 className="text-lg font-semibold mb-4">Your Information</h3>
                  
                  <form onSubmit={handleBookingSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={bookingData.customerName}
                          onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={bookingData.customerEmail}
                          onChange={(e) => setBookingData({ ...bookingData, customerEmail: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={bookingData.customerPhone}
                          onChange={(e) => setBookingData({ ...bookingData, customerPhone: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={bookingData.notes}
                          onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg"
                          rows={3}
                        />
                      </div>

                      {/* Booking Summary */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Booking Summary</h4>
                        <p className="text-sm text-gray-600">Service: {selectedService?.name}</p>
                        <p className="text-sm text-gray-600">Date: {selectedDate}</p>
                        <p className="text-sm text-gray-600">Time: {selectedTime}</p>
                        {selectedStaff && (
                          <p className="text-sm text-gray-600">Professional: {selectedStaff.name}</p>
                        )}
                        <p className="text-sm font-semibold mt-2">
                          Total: {selectedPackage ? 'Using Package Session' : `$${selectedService?.price}`}
                        </p>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-lg text-white font-medium disabled:opacity-50"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 4: Success */}
              {bookingStep === 5 && bookingSuccess && (
                <div className="text-center py-8">
                  <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
                  <h3 className="text-2xl font-bold mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-600 mb-6">
                    Your appointment has been successfully booked. You will receive a confirmation email shortly.
                  </p>
                  <button
                    onClick={() => {
                      setShowBookingModal(false)
                      setBookingStep(1)
                      setBookingSuccess(false)
                      setSelectedService(null)
                      setSelectedPackage(null)
                      setBookingData({
                        customerName: '',
                        customerEmail: '',
                        customerPhone: '',
                        notes: ''
                      })
                    }}
                    className="px-6 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Package Reservation Modal */}
      {showPackageReserveModal && selectedPackageForPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Reserve Package: {selectedPackageForPurchase.name}</h2>
              <button
                onClick={() => setShowPackageReserveModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handlePackageReserve}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={reservationData.name}
                      onChange={(e) => setReservationData({ ...reservationData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={reservationData.email}
                      onChange={(e) => setReservationData({ ...reservationData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={reservationData.phone}
                      onChange={(e) => setReservationData({ ...reservationData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={reservationData.paymentMethod}
                      onChange={(e) => setReservationData({ ...reservationData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    >
                      <option value="TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={reservationData.notes}
                      onChange={(e) => setReservationData({ ...reservationData, notes: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'Reserving...' : 'Reserve Package'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImageModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImageModal(null)}>
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X size={32} />
            </button>
            <img
              src={selectedImageModal.url || selectedImageModal.imageUrl}
              alt={selectedImageModal.title || 'Gallery image'}
              className="w-full h-auto rounded-lg"
            />
            {selectedImageModal.title && (
              <p className="text-white text-center mt-4 text-xl">{selectedImageModal.title}</p>
            )}
            {selectedImageModal.description && (
              <p className="text-gray-300 text-center mt-2">{selectedImageModal.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}