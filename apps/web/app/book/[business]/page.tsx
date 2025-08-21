'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: string
  isActive: boolean
}

interface BusinessInfo {
  name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  website?: string
  description?: string
}

interface ScheduleSettings {
  timeInterval: number
  startTime: string
  endTime: string
  workingDays: number[]
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const businessId = params.business as string
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({})
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    timeInterval: 60,
    startTime: '09:00',
    endTime: '18:00',
    workingDays: [1, 2, 3, 4, 5]
  })
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Load business information from API
  useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        const response = await fetch(`/api/public/business/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBusinessInfo({
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            website: data.website,
            description: data.description
          })
          
          // Load schedule settings from business settings
          if (data.settings?.scheduleSettings) {
            setScheduleSettings(data.settings.scheduleSettings)
          }
        } else {
          // Business not found or blocked
          alert(t('businessNotFound'))
          router.push('/')
        }
      } catch (error) {
        console.error('Error loading business info:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBusinessInfo()
  }, [businessId, router, t])

  // Load services from API
  const loadServices = async () => {
    try {
      const response = await fetch('/api/dashboard/services')
      if (response.ok) {
        const data = await response.json()
        setServices(Array.isArray(data) ? data.filter((s: Service) => s.isActive) : [])
      }
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }

  useEffect(() => {
    loadServices()

    // Set minimum date to today or next working day
    const today = new Date()
    let initialDate = today
    
    // Check if today is a working day, if not find next working day
    while (!scheduleSettings.workingDays.includes(initialDate.getDay())) {
      initialDate.setDate(initialDate.getDate() + 1)
    }
    
    setSelectedDate(initialDate.toISOString().split('T')[0])
  }, [scheduleSettings.workingDays])

  // Reload services when entering step 1 (service selection)
  useEffect(() => {
    if (step === 1) {
      loadServices()
    }
  }, [step])

  // Function to load occupied slots from API
  const loadOccupiedSlots = async () => {
    if (selectedDate) {
      try {
        const response = await fetch('/api/dashboard/appointments')
        if (response.ok) {
          const appointments = await response.json()
          // Filter appointments for selected date and get their times
          const occupied = appointments
            .filter((apt: any) => 
              apt.date === selectedDate && 
              (apt.status === 'pending' || apt.status === 'confirmed')
            )
            .map((apt: any) => apt.time)
          setOccupiedSlots(occupied)
        }
      } catch (error) {
        console.error('Error loading appointments:', error)
        setOccupiedSlots([])
      }
    }
  }

  // Load occupied time slots when date changes
  useEffect(() => {
    loadOccupiedSlots()
  }, [selectedDate])

  // Reload occupied slots when entering step 2
  useEffect(() => {
    if (step === 2) {
      loadOccupiedSlots()
    }
  }, [step, selectedDate])

  // Generate available time slots based on schedule settings
  const generateTimeSlots = () => {
    const slots = []
    const [startHour, startMinute] = scheduleSettings.startTime.split(':').map(Number)
    const [endHour, endMinute] = scheduleSettings.endTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += scheduleSettings.timeInterval) {
      const hour = Math.floor(minutes / 60)
      const minute = minutes % 60
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(timeString)
    }
    
    return slots
  }
  
  const availableTimes = generateTimeSlots()

  // Check if a date is a working day
  const isWorkingDay = (dateString: string) => {
    const date = new Date(dateString)
    const dayOfWeek = date.getDay()
    return scheduleSettings.workingDays.includes(dayOfWeek)
  }

  // Handle date change with validation
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    
    // Check if it's a working day
    if (!isWorkingDay(newDate)) {
      const date = new Date(newDate)
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = t(dayNames[date.getDay()] as any)
      alert(`${dayName} ${t('isNotWorkingDay')}`)
      // Find next working day
      let nextDate = new Date(newDate)
      while (!scheduleSettings.workingDays.includes(nextDate.getDay())) {
        nextDate.setDate(nextDate.getDate() + 1)
      }
      setSelectedDate(nextDate.toISOString().split('T')[0])
    }
  }

  const handleSubmitBooking = async () => {
    // Create the appointment
    const newAppointment = {
      customerName: customerInfo.name,
      service: selectedService?.name || '',
      date: selectedDate,
      time: selectedTime,
      status: 'pending' as const,
      price: selectedService?.price || 0,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone
    }

    // Save appointment to database
    try {
      const response = await fetch('/api/dashboard/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAppointment),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create appointment')
      }

      // Save customer to database
      const customerResponse = await fetch('/api/dashboard/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          totalVisits: 1,
          totalSpent: selectedService?.price || 0,
          lastVisit: selectedDate,
          status: 'active'
        }),
      })

      // Send confirmation email
      try {
        const emailResponse = await fetch('/api/email/send-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: Date.now().toString(), // Generate a unique ID for the appointment
            customerEmail: customerInfo.email,
            customerName: customerInfo.name,
            service: selectedService?.name || '',
            date: selectedDate,
            time: selectedTime,
            price: selectedService?.price || 0,
            businessName: businessInfo.name || 'Business',
            businessAddress: businessInfo.address,
            businessPhone: businessInfo.phone,
            language: language // Pass the current language
          }),
        })
        
        if (!emailResponse.ok) {
          console.error('Email send failed:', await emailResponse.text())
        } else {
          const result = await emailResponse.json()
          console.log('Email sent successfully:', result)
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
      }

      // Navigate to confirmation page
      const confirmationData = {
        customerName: customerInfo.name,
        service: selectedService?.name || '',
        date: selectedDate,
        time: selectedTime,
        businessName: businessInfo.name || 'Business'
      }
      
      router.push(`/confirm?data=${encodeURIComponent(JSON.stringify(confirmationData))}`)
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert(t('failedToBookAppointment'))
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('bookAppointment')} {businessInfo.name ? `- ${businessInfo.name}` : ''}
          </h1>
          <p className="text-gray-600">
            {t('selectServiceAndTime')}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex-1 ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'} h-2 rounded-l`} />
            <div className={`flex-1 mx-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'} h-2`} />
            <div className={`flex-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'} h-2 rounded-r`} />
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-sm ${step === 1 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              {t('selectService')}
            </span>
            <span className={`text-sm ${step === 2 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              {t('selectDateTime')}
            </span>
            <span className={`text-sm ${step === 3 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              {t('confirmBooking')}
            </span>
          </div>
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('selectService')}</h2>
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedService?.id === service.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {t('duration')}: {service.duration} {t('minutes')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">${service.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {services.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                {t('noServicesAvailable')}
              </p>
            )}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('cancelBtn')}
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedService}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('nextStep')}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('selectDateTime')}</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('selectDate')}
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('selectTime')}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableTimes.map((time) => {
                  const isOccupied = occupiedSlots.includes(time)
                  return (
                    <button
                      key={time}
                      onClick={() => !isOccupied && setSelectedTime(time)}
                      disabled={isOccupied}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedTime === time
                          ? 'bg-blue-600 text-white'
                          : isOccupied
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('previousStep')}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('nextStep')}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Information & Confirmation */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('confirmBooking')}</h2>
            
            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">{t('bookingSummary')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('service')}:</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('date')}:</span>
                  <span className="font-medium">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('time')}:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('price')}:</span>
                  <span className="font-medium">${selectedService?.price}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('previousStep')}
              </button>
              <button
                onClick={handleSubmitBooking}
                disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('confirmBooking')}
              </button>
            </div>
          </div>
        )}

        {/* Business Actions */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
          >
            ← {t('backToDirectory')}
          </button>
        </div>
      </div>
    </div>
  )
}