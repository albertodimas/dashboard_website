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
  Facebook,
  Instagram,
  Twitter,
  MessageCircle,
  Info,
  Search,
  Grid3X3,
  Filter
} from 'lucide-react'

interface BusinessLandingProps {
  business: any
}

export default function BusinessLandingNew({ business }: BusinessLandingProps) {
  // Extract theme colors from business settings
  const theme = business.settings?.theme || {}
  const colors = {
    primary: theme.primaryColor || '#3B82F6',
    secondary: theme.secondaryColor || '#1F2937',
    accent: theme.accentColor || '#10B981',
    background: theme.backgroundColor || '#FFFFFF'
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showPackageReserveModal, setShowPackageReserveModal] = useState(false)
  const [bookingStep, setBookingStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [availableStaff, setAvailableStaff] = useState<any[]>([])
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
  const [activeGalleryTab, setActiveGalleryTab] = useState('')
  const [currentServicePage, setCurrentServicePage] = useState(1)
  const servicesPerPage = 6
  const [serviceSearchTerm, setServiceSearchTerm] = useState('')
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('all')
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [selectedServicesCategory, setSelectedServicesCategory] = useState('all')
  const [serviceSearchTermMain, setServiceSearchTermMain] = useState('')
  const [reservationData, setReservationData] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'TRANSFER',
    notes: ''
  })
  const [reservationSuccess, setReservationSuccess] = useState(false)

  // Format working hours
  const formatWorkingHours = (hours: any[], settings: any) => {
    const daysMap: any = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday'
    }
    
    if (!hours || hours.length === 0) return []
    
    const groupedHours: any = {}
    
    hours.forEach(hour => {
      const day = daysMap[hour.dayOfWeek] || `Day ${hour.dayOfWeek}`
      const timeRange = `${hour.openTime} - ${hour.closeTime}`
      
      if (groupedHours[timeRange]) {
        groupedHours[timeRange].push(day)
      } else {
        groupedHours[timeRange] = [day]
      }
    })
    
    return Object.entries(groupedHours).map(([time, days]: [string, any]) => ({
      days: days.length === 7 ? 'Every day' : 
            days.length === 5 && !days.includes('Saturday') && !days.includes('Sunday') ? 'Mon-Fri' :
            days.length === 2 && days.includes('Saturday') && days.includes('Sunday') ? 'Weekends' :
            days.join(', '),
      time
    }))
  }

  const workingHours = formatWorkingHours(business.workingHours || [], business.settings || {})

  // Fetch reviews on component mount
  useEffect(() => {
    if (business?.id) {
      fetchReviews()
    }
  }, [business?.id])

  // Fetch available time slots when date or service changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedService, selectedStaff])

  const fetchReviews = async () => {
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

  const fetchStaffForService = async (serviceId: string) => {
    try {
      const businessIdentifier = business.customSlug || business.slug || business.id
      const url = `/api/public/staff/${encodeURIComponent(businessIdentifier)}?serviceId=${serviceId}`
      
      const response = await fetch(url)
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText)
      }
      
      const data = await response.json()
      setAvailableStaff(data.staff || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
      setAvailableStaff([])
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
      
      const response = await fetch(`/api/public/availability?${params.toString()}`)
      const data = await response.json()
      setAvailableSlots(data.slots || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      setAvailableSlots([])
    } finally {
      setIsLoadingSlots(false)
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
      
      if (selectedPackage) {
        appointmentData.packageId = selectedPackage.id
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
        setBookingSuccess(true)
        setBookingStep(5) // Success step
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
          packageId: selectedPackage?.id,
          customerName: reservationData.name,
          customerEmail: reservationData.email,
          customerPhone: reservationData.phone,
          paymentMethod: reservationData.paymentMethod,
          notes: reservationData.notes
        })
      })

      if (response.ok) {
        const result = await response.json()
        setReservationSuccess(true)
        alert(`Package reserved successfully! ${result.purchase.paymentInstructions.message}`)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="fixed top-0 w-full backdrop-blur-md bg-white/80 border-b border-gray-100 z-50">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/business/${business.slug}`} className="text-3xl font-black tracking-tight" style={{ color: colors.primary }}>
              {business.name}
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-700 hover:text-gray-900 font-medium transition duration-300 hover:scale-105">Services</a>
              {business.enablePackagesModule && business.packages && business.packages.length > 0 && (
                <a href="#packages" className="text-gray-700 hover:text-gray-900 font-medium transition duration-300 hover:scale-105">Packages</a>
              )}
              <a href="#gallery" className="text-gray-700 hover:text-gray-900 font-medium transition duration-300 hover:scale-105">Gallery</a>
              <a href="#reviews" className="text-gray-700 hover:text-gray-900 font-medium transition duration-300 hover:scale-105">Reviews</a>
              <a href="#contact" className="text-gray-700 hover:text-gray-900 font-medium transition duration-300 hover:scale-105">Contact</a>
              <Link href="/client/login" className="text-gray-700 hover:text-gray-900 font-medium transition duration-300 hover:scale-105">My Portal</Link>
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition duration-300"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
              >
                Book Now
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition duration-200"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="container mx-auto px-6 py-4 space-y-4">
              <a href="#services" className="block py-2 text-gray-700 hover:text-gray-900 font-medium">Services</a>
              {business.enablePackagesModule && business.packages && business.packages.length > 0 && (
                <a href="#packages" className="block py-2 text-gray-700 hover:text-gray-900 font-medium">Packages</a>
              )}
              <a href="#gallery" className="block py-2 text-gray-700 hover:text-gray-900 font-medium">Gallery</a>
              <a href="#reviews" className="block py-2 text-gray-700 hover:text-gray-900 font-medium">Reviews</a>
              <a href="#contact" className="block py-2 text-gray-700 hover:text-gray-900 font-medium">Contact</a>
              <Link href="/client/login" className="block py-2 text-gray-700 hover:text-gray-900 font-medium">My Portal</Link>
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
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Welcome to {business.name}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {business.description || 'Professional services tailored to meet your needs'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-8 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition duration-300"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
              >
                Book an Appointment
              </button>
              {business.enablePackagesModule && business.packages && business.packages.length > 0 && (
                <button
                  onClick={() => setShowPackageReserveModal(true)}
                  className="px-8 py-3 rounded-xl font-semibold bg-yellow-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition duration-300"
                >
                  Reserve a Package
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4 text-gray-900">Our Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional services tailored to meet your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {business.services?.slice(0, 6).map((service: any) => (
              <div 
                key={service.id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 transform hover:-translate-y-1 transition duration-300"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <Clock size={16} className="mr-1" style={{ color: colors.primary }} />
                    <span className="text-sm font-medium">{service.duration} min</span>
                  </div>
                  <div className="text-2xl font-black" style={{ color: colors.primary }}>
                    ${service.price}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedService(service)
                    setShowBookingModal(true)
                    setBookingStep(business.enableStaffModule ? 2 : 3)
                  }}
                  className="mt-4 w-full py-2.5 rounded-xl font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      {business.enablePackagesModule && business.packages && business.packages.length > 0 && (
        <section id="packages" className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-6 text-gray-900">
                Special Packages
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Save more with our carefully curated service bundles
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {business.packages.map((pkg: any) => (
                <div key={pkg.id} className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition duration-300">
                  <div className="p-8">
                    <h3 className="text-2xl font-bold mb-4">{pkg.name}</h3>
                    <p className="text-gray-600 mb-6">{pkg.description}</p>
                    
                    {/* Services included */}
                    <div className="mb-6 space-y-2">
                      {pkg.services?.map((ps: any) => (
                        <div key={ps.serviceId} className="flex items-center text-sm">
                          <CheckCircle size={16} className="mr-2 text-green-500" />
                          <span>{ps.service?.name} ({ps.quantity}x)</span>
                        </div>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="text-3xl font-bold mb-6" style={{ color: colors.primary }}>
                      ${pkg.price}
                      {pkg.discount && (
                        <span className="ml-2 text-sm bg-red-500 text-white px-2 py-1 rounded">
                          {pkg.discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          setSelectedPackage(pkg)
                          setShowPackageReserveModal(true)
                        }}
                        className="w-full py-3 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition"
                      >
                        Reserve This Package
                      </button>
                      <button 
                        onClick={() => {
                          const firstService = pkg.services?.[0]?.service || pkg
                          setSelectedService(firstService)
                          setSelectedPackage(pkg)
                          setShowBookingModal(true)
                          setBookingStep(business.enableStaffModule ? 2 : 3)
                        }}
                        className="w-full py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                      >
                        Book First Session
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-black text-center mb-12 text-gray-900">Contact Us</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Address */}
            <div className="text-center">
              <MapPin size={40} className="mx-auto mb-4" style={{ color: colors.primary }} />
              <h3 className="font-semibold mb-2">Address</h3>
              <p className="text-gray-600">
                {business.address}<br />
                {business.city}, {business.state} {business.zipCode}
              </p>
            </div>
            
            {/* Phone */}
            <div className="text-center">
              <Phone size={40} className="mx-auto mb-4" style={{ color: colors.primary }} />
              <h3 className="font-semibold mb-2">Phone</h3>
              <p className="text-gray-600">{business.phone}</p>
            </div>
            
            {/* Email */}
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

      {/* Package Reservation Modal */}
      {showPackageReserveModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Reserve Package: {selectedPackage.name}</h2>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={reservationData.paymentMethod}
                      onChange={(e) => setReservationData({ ...reservationData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Any special requests..."
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
    </div>
  )
}