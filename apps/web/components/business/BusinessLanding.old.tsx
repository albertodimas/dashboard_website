'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  User, 
  Package, 
  ChevronRight, 
  AlertCircle,
  CheckCircle,
  X,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'

interface BusinessLandingProps {
  business: any
}

export default function BusinessLanding({ business }: BusinessLandingProps) {
  const theme = business.settings?.theme || {}
  const colors = {
    primary: theme.primaryColor || '#3B82F6',
    secondary: theme.secondaryColor || '#1F2937',
    accent: theme.accentColor || '#10B981',
    background: theme.backgroundColor || '#FFFFFF'
  }

  const [customerPackages, setCustomerPackages] = useState<any[]>([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
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
  const [bookingStep, setBookingStep] = useState(1)
  const [customerSession, setCustomerSession] = useState<any>(null)

  // Check if customer is logged in and fetch their packages
  useEffect(() => {
    checkCustomerSession()
  }, [])

  // Fetch available slots when date and service are selected
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedService])

  const checkCustomerSession = async () => {
    try {
      const response = await fetch('/api/client/packages')
      if (response.ok) {
        const data = await response.json()
        setCustomerSession(data.customer)
        
        // Filter packages for this business
        const businessPackages = data.packages?.filter((pkg: any) => 
          pkg.businessId === business.id && 
          pkg.status === 'ACTIVE' && 
          pkg.remainingSessions > 0
        ) || []
        
        setCustomerPackages(businessPackages)
        
        // Pre-fill customer data if logged in
        if (data.customer) {
          setBookingData(prev => ({
            ...prev,
            customerName: data.customer.name || '',
            customerEmail: data.customer.email || ''
          }))
        }
      }
    } catch (error) {
      console.log('Customer not logged in or error fetching packages')
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
      
      const response = await fetch(`/api/public/appointments/slots?${params}`)
      const data = await response.json()
      setAvailableSlots(data.availableSlots || [])
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
      
      // Add package purchase ID if using a package
      if (selectedPackage) {
        appointmentData.packagePurchaseId = selectedPackage.id
        appointmentData.usePackageSession = true
      }
      
      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      })

      if (response.ok) {
        setBookingSuccess(true)
        setBookingStep(4) // Success step
        
        // Refresh packages if using a session
        if (selectedPackage) {
          checkCustomerSession()
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

  const getServiceFromPackage = (pkg: any) => {
    // Get the first service from the package
    return pkg.package?.services?.[0]?.service || null
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
            {customerSession && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Welcome, {customerSession.name}
                </span>
                {customerPackages.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {customerPackages.reduce((sum, pkg) => sum + pkg.remainingSessions, 0)} sessions available
                  </span>
                )}
                <Link href="/client/portal" className="text-sm text-blue-600 hover:text-blue-700">
                  My Portal
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-black mb-4" style={{ color: colors.primary }}>
            {business.name}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {business.description || 'Professional services for you'}
          </p>
          
          {/* Customer packages alert */}
          {customerPackages.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800 font-medium">
                  You have {customerPackages.reduce((sum, pkg) => sum + pkg.remainingSessions, 0)} sessions available to use!
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setShowBookingModal(true)
              setBookingStep(1)
            }}
            className="inline-flex items-center px-8 py-3 text-lg font-semibold text-white rounded-full hover:scale-105 transition-all"
            style={{ backgroundColor: colors.primary }}
          >
            Book Appointment
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: colors.primary }}>
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
        <section className="py-16 px-6 bg-gray-50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: colors.primary }}>
              Package Deals
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {business.packages?.map((pkg: any) => (
                <div key={pkg.id} className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 mb-4">{pkg.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold" style={{ color: colors.primary }}>
                      ${pkg.price}
                    </span>
                    {pkg.originalPrice > pkg.price && (
                      <span className="text-lg text-gray-400 line-through ml-2">
                        ${pkg.originalPrice}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <p>✓ {pkg.sessionCount} sessions included</p>
                    <p>✓ Valid for {pkg.validityDays} days</p>
                  </div>
                  <Link
                    href={`/business/${business.slug}/packages/${pkg.id}`}
                    className="block w-full text-center py-2 rounded-lg text-white font-medium hover:opacity-90 transition"
                    style={{ backgroundColor: colors.accent }}
                  >
                    Purchase Package
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: colors.primary }}>
            Contact Us
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {business.phone && (
              <div className="text-center">
                <Phone className="w-8 h-8 mx-auto mb-3" style={{ color: colors.primary }} />
                <p className="font-medium">Phone</p>
                <p className="text-gray-600">{business.phone}</p>
              </div>
            )}
            {business.email && (
              <div className="text-center">
                <Mail className="w-8 h-8 mx-auto mb-3" style={{ color: colors.primary }} />
                <p className="font-medium">Email</p>
                <p className="text-gray-600">{business.email}</p>
              </div>
            )}
            {business.address && (
              <div className="text-center">
                <MapPin className="w-8 h-8 mx-auto mb-3" style={{ color: colors.primary }} />
                <p className="font-medium">Address</p>
                <p className="text-gray-600">{business.address}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Book Appointment</h2>
              <button
                onClick={() => {
                  setShowBookingModal(false)
                  setBookingStep(1)
                  setSelectedService(null)
                  setSelectedPackage(null)
                  setSelectedDate('')
                  setSelectedTime('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Progress steps */}
              <div className="flex items-center justify-center mb-8">
                <div className={`flex items-center ${bookingStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${bookingStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                    1
                  </div>
                  <span className="ml-2 text-sm">Service</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-300 mx-2" />
                <div className={`flex items-center ${bookingStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${bookingStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                    2
                  </div>
                  <span className="ml-2 text-sm">Date & Time</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-300 mx-2" />
                <div className={`flex items-center ${bookingStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${bookingStep >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                    3
                  </div>
                  <span className="ml-2 text-sm">Details</span>
                </div>
              </div>

              {/* Step 1: Select Service & Package */}
              {bookingStep === 1 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Service</h3>
                  
                  {/* If customer has packages, show them first */}
                  {customerPackages.length > 0 && (
                    <div className="mb-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-green-900 mb-3">Use Your Package Sessions</h4>
                        <div className="space-y-2">
                          {customerPackages.map((pkg) => {
                            const service = getServiceFromPackage(pkg)
                            return (
                              <label key={pkg.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-green-100">
                                <input
                                  type="radio"
                                  name="package"
                                  checked={selectedPackage?.id === pkg.id}
                                  onChange={() => {
                                    setSelectedPackage(pkg)
                                    setSelectedService(service)
                                  }}
                                  className="mr-3"
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{pkg.package?.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {pkg.remainingSessions} sessions remaining • Expires {new Date(pkg.expiryDate).toLocaleDateString()}
                                  </p>
                                  {service && (
                                    <p className="text-sm text-gray-500">
                                      Service: {service.name}
                                    </p>
                                  )}
                                </div>
                                <span className="text-green-600 font-medium">FREE</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Regular services */}
                  <div className="space-y-2">
                    <h4 className="font-medium mb-2">Or Book a Regular Service</h4>
                    {business.services?.map((service: any) => (
                      <label key={service.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="service"
                          checked={selectedService?.id === service.id && !selectedPackage}
                          onChange={() => {
                            setSelectedService(service)
                            setSelectedPackage(null)
                          }}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-600">
                            {service.duration} minutes • {service.description}
                          </p>
                        </div>
                        <span className="font-bold text-lg">${service.price}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={() => setBookingStep(2)}
                    disabled={!selectedService}
                    className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* Step 2: Select Date & Time */}
              {bookingStep === 2 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Selected Service: {selectedService?.name}</p>
                    {selectedPackage && (
                      <p className="text-sm text-green-600 font-medium">Using package session (FREE)</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  {selectedDate && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Available Times</label>
                      {isLoadingSlots ? (
                        <p className="text-gray-500">Loading available times...</p>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedTime(slot)}
                              className={`p-2 border rounded-lg ${
                                selectedTime === slot
                                  ? 'bg-blue-600 text-white'
                                  : 'hover:bg-gray-50'
                              }`}
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

                  <div className="flex gap-3">
                    <button
                      onClick={() => setBookingStep(1)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setBookingStep(3)}
                      disabled={!selectedDate || !selectedTime}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Contact Details */}
              {bookingStep === 3 && (
                <form onSubmit={handleBookingSubmit}>
                  <h3 className="text-lg font-semibold mb-4">Your Details</h3>
                  
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>Service:</strong> {selectedService?.name}</p>
                    <p className="text-sm"><strong>Date:</strong> {selectedDate}</p>
                    <p className="text-sm"><strong>Time:</strong> {selectedTime}</p>
                    {selectedPackage ? (
                      <p className="text-sm text-green-600 font-medium"><strong>Payment:</strong> Using package session (FREE)</p>
                    ) : (
                      <p className="text-sm"><strong>Price:</strong> ${selectedService?.price}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name *</label>
                      <input
                        type="text"
                        required
                        value={bookingData.customerName}
                        onChange={(e) => setBookingData({...bookingData, customerName: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        readOnly={!!customerSession}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={bookingData.customerEmail}
                        onChange={(e) => setBookingData({...bookingData, customerEmail: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        readOnly={!!customerSession}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={bookingData.customerPhone}
                        onChange={(e) => setBookingData({...bookingData, customerPhone: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                      <textarea
                        value={bookingData.notes}
                        onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 4: Success */}
              {bookingStep === 4 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-600 mb-6">
                    Your appointment has been successfully booked for {selectedDate} at {selectedTime}.
                  </p>
                  {selectedPackage && (
                    <p className="text-sm text-green-600 mb-4">
                      Package session used. Remaining sessions: {selectedPackage.remainingSessions - 1}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setShowBookingModal(false)
                      setBookingStep(1)
                      setSelectedService(null)
                      setSelectedPackage(null)
                      setSelectedDate('')
                      setSelectedTime('')
                      setBookingSuccess(false)
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}