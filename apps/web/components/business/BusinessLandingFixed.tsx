'use client'

import { useState, useEffect } from 'react'
import { Star, MapPin, Phone, Mail, Clock, Calendar, Users, Package, ChevronLeft, X, Check, Eye } from 'lucide-react'

interface BusinessLandingProps {
  business: any
}

export default function BusinessLandingFixed({ business }: BusinessLandingProps) {
  // Estados básicos
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingStep, setBookingStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: ''
  })
  
  // Datos del negocio
  const reviews = business.reviews || []
  const galleryItems = business.galleryItems || []
  const staff = business.staff || []
  const workingHours = business.workingHours || []
  
  // Debug logs
  console.log('[CLIENT] BusinessLandingFixed - Data received:', {
    reviewsLength: reviews.length,
    galleryItemsLength: galleryItems.length,
    staffLength: staff.length,
    workingHoursLength: workingHours.length,
    firstReview: reviews[0],
    firstGalleryItem: galleryItems[0]
  })
  
  // Colores del tema
  const colors = {
    primary: business.settings?.theme?.primaryColor || '#8B5CF6',
    accent: business.settings?.theme?.accentColor || '#F59E0B'
  }

  // Días de la semana
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Fetch available slots
  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedService) return
    
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

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedService, selectedStaff])

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: selectedService.id,
          staffId: selectedStaff?.id,
          date: selectedDate,
          time: selectedTime,
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone,
          notes: bookingData.notes
        })
      })

      if (response.ok) {
        alert('Appointment booked successfully!')
        setShowBookingModal(false)
        resetBookingForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const resetBookingForm = () => {
    setBookingStep(1)
    setSelectedService(null)
    setSelectedDate('')
    setSelectedTime('')
    setSelectedStaff(null)
    setBookingData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      notes: ''
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="fixed top-0 w-full backdrop-blur-md bg-white/80 border-b border-gray-100 z-50">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black" style={{ color: colors.primary }}>
              {business.name}
            </h1>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition duration-300"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
            >
              Book Now
            </button>
          </div>
        </nav>
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
            {/* Stats */}
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {business.stats?.completedAppointments || 0}
                </div>
                <div className="text-gray-600">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {business.stats?.averageRating?.toFixed(1) || '5.0'}
                </div>
                <div className="text-gray-600">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {business.services?.length || 0}
                </div>
                <div className="text-gray-600">Services</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-black text-center mb-12" style={{ color: colors.primary }}>
            Our Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {business.services?.map((service: any) => (
              <div key={service.id} className="bg-white rounded-2xl shadow-lg p-6 border">
                <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    <Clock className="inline w-4 h-4 mr-1" />
                    {service.duration} min
                  </span>
                  <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                    ${service.price}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedService(service)
                    setShowBookingModal(true)
                  }}
                  className="mt-4 w-full py-2 rounded-lg font-semibold text-white"
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
      {business.packages?.length > 0 && (
        <section id="packages" className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-black text-center mb-12" style={{ color: colors.primary }}>
              Special Packages
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {business.packages.map((pkg: any) => (
                <div key={pkg.id} className="bg-white rounded-2xl shadow-lg p-6 border">
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 mb-4">{pkg.description}</p>
                  <div className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>
                    ${pkg.price}
                  </div>
                  {pkg.originalPrice && (
                    <div className="text-sm text-gray-500 line-through mb-4">
                      ${pkg.originalPrice}
                    </div>
                  )}
                  <ul className="space-y-2 mb-4">
                    {pkg.services?.map((ps: any) => (
                      <li key={ps.id} className="flex items-center">
                        <Check className="w-4 h-4 mr-2" style={{ color: colors.accent }} />
                        {ps.quantity}x {ps.service.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {galleryItems.length > 0 && (
        <section id="gallery" className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-black text-center mb-12" style={{ color: colors.primary }}>
              Gallery
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryItems.map((item: any, index: number) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.title || 'Gallery image'}
                    className="w-full h-full object-cover hover:scale-105 transition"
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
            <h2 className="text-4xl font-black text-center mb-12" style={{ color: colors.primary }}>
              Customer Reviews
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review: any) => (
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

      {/* Contact & Working Hours Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-black text-center mb-12" style={{ color: colors.primary }}>
            Contact & Hours
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              <div className="space-y-3">
                {business.address && (
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3" style={{ color: colors.primary }} />
                    <span>{business.address}, {business.city}, {business.state}</span>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-3" style={{ color: colors.primary }} />
                    <span>{business.phone}</span>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-3" style={{ color: colors.primary }} />
                    <span>{business.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <h3 className="text-xl font-bold mb-4">Working Hours</h3>
              <div className="space-y-2">
                {[0, 1, 2, 3, 4, 5, 6].map(day => {
                  const dayHours = workingHours.find((wh: any) => wh.dayOfWeek === day && !wh.staffId)
                  return (
                    <div key={day} className="flex justify-between">
                      <span className="font-medium">{daysOfWeek[day]}</span>
                      <span className="text-gray-600">
                        {dayHours && dayHours.isActive
                          ? `${dayHours.startTime} - ${dayHours.endTime}`
                          : 'Closed'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Book an Appointment</h2>
              <button
                onClick={() => {
                  setShowBookingModal(false)
                  resetBookingForm()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {/* Step 1: Select Service */}
            {bookingStep === 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Select a Service</h3>
                <div className="space-y-2">
                  {business.services?.map((service: any) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service)
                        setBookingStep(2)
                      }}
                      className="w-full text-left p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="font-semibold">{service.name}</div>
                      <div className="text-sm text-gray-600">
                        {service.duration} minutes - ${service.price}
                      </div>
                    </button>
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
                
                {/* Staff Selection */}
                {staff.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Select Staff (Optional)
                    </label>
                    <select
                      value={selectedStaff?.id || ''}
                      onChange={(e) => {
                        const s = staff.find((st: any) => st.id === e.target.value)
                        setSelectedStaff(s || null)
                      }}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Any Available</option>
                      {staff.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
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

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Available Times
                    </label>
                    {isLoadingSlots ? (
                      <p className="text-gray-500">Loading available times...</p>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => {
                              setSelectedTime(slot)
                              setBookingStep(3)
                            }}
                            className="px-4 py-2 border rounded-lg hover:bg-blue-50 hover:border-blue-500"
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
              <form onSubmit={handleBookingSubmit}>
                <button
                  type="button"
                  onClick={() => setBookingStep(2)}
                  className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft size={20} className="mr-1" />
                  Back
                </button>
                
                <h3 className="text-lg font-semibold mb-4">Your Information</h3>
                
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedService?.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedDate} at {selectedTime}
                  </p>
                  {selectedStaff && (
                    <p className="text-sm text-gray-600">
                      with {selectedStaff.name}
                    </p>
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
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={bookingData.customerEmail}
                      onChange={(e) => setBookingData({...bookingData, customerEmail: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={bookingData.customerPhone}
                      onChange={(e) => setBookingData({...bookingData, customerPhone: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                    <textarea
                      value={bookingData.notes}
                      onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={3}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full py-3 rounded-xl font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
                >
                  Confirm Booking
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}