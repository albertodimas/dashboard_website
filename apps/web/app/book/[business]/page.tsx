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
  assignedStaff?: string[]
}

interface Staff {
  id: string
  name: string
  photo?: string
  bio?: string
  specialties: string[]
  rating: number
  totalReviews: number
  workingHours: {
    dayOfWeek: number
    startTime: string
    endTime: string
  }[]
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
  enableStaffModule?: boolean
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
  
  // Get serviceId from URL params if present
  const [urlServiceId, setUrlServiceId] = useState<string | null>(null)
  
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({})
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    timeInterval: 60,
    startTime: '09:00',
    endTime: '18:00',
    workingDays: [0, 1, 2, 3, 4, 5, 6] // Incluir todos los días para pruebas (0=domingo, 6=sábado)
  })
  const [staffSchedule, setStaffSchedule] = useState<any>(null) // Horarios específicos del trabajador
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [staffModuleEnabled, setStaffModuleEnabled] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Get serviceId from URL query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const serviceIdParam = urlParams.get('serviceId')
    if (serviceIdParam) {
      setUrlServiceId(serviceIdParam)
    }
  }, [])

  // Load business information from API
  useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        console.log('Loading business info for:', businessId)
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
          
          // Check if staff module is enabled for this business
          console.log('Business data:', data)
          console.log('Staff module enabled from API:', data.enableStaffModule)
          setStaffModuleEnabled(data.enableStaffModule === true)
          
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
      const response = await fetch(`/api/public/services/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Services loaded from API:', data)
        const activeServices = Array.isArray(data) ? data.filter((s: Service) => s.isActive) : []
        setServices(activeServices)
        
        // If there's a serviceId from URL, pre-select it
        if (urlServiceId && activeServices.length > 0) {
          const preSelectedService = activeServices.find((s: Service) => s.id === urlServiceId)
          if (preSelectedService) {
            setSelectedService(preSelectedService)
            // If staff module is enabled, load staff for this service
            if (staffModuleEnabled) {
              try {
                const staffResponse = await fetch(`/api/public/staff/${businessId}?serviceId=${preSelectedService.id}`)
                if (staffResponse.ok) {
                  const staffData = await staffResponse.json()
                  setAvailableStaff(staffData.staff || [])
                  // Move to staff selection step
                  setStep(2)
                }
              } catch (error) {
                console.error('Error loading staff:', error)
              }
            } else {
              // Move directly to date/time selection
              setStep(2)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }

  // Debug state changes
  useEffect(() => {
    console.log('=== STATE UPDATE ===', {
      step,
      staffModuleEnabled,
      selectedService: selectedService?.name,
      availableStaff: availableStaff.length,
      selectedStaff: selectedStaff?.name
    })
  }, [step, staffModuleEnabled, selectedService, availableStaff, selectedStaff])

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
  }, [scheduleSettings.workingDays, urlServiceId, staffModuleEnabled])

  // Reload services when entering step 1 (service selection)
  useEffect(() => {
    if (step === 1) {
      loadServices()
    }
  }, [step])

  // Function to load occupied slots from API
  const loadOccupiedSlots = async (staffId?: string) => {
    if (selectedDate && selectedService) {
      try {
        // Use the public appointments API to get available slots
        const params = new URLSearchParams({
          businessId: businessId,
          serviceId: selectedService.id,
          date: selectedDate
        })
        
        // Add staffId if available
        if (staffId) {
          params.append('staffId', staffId)
        }
        
        const response = await fetch(`/api/public/appointments?${params}`)
        if (response.ok) {
          const data = await response.json()
          // The API returns available slots, so we need to invert this
          // to get occupied slots for our time slot display
          const allSlots = generateTimeSlots()
          const availableSlots = data.availableSlots || []
          const occupied = allSlots.filter(slot => !availableSlots.includes(slot))
          setOccupiedSlots(occupied)
        }
      } catch (error) {
        console.error('Error loading appointments:', error)
        setOccupiedSlots([])
      }
    }
  }

  // Load occupied time slots when date or service changes
  useEffect(() => {
    if (selectedService) {
      loadOccupiedSlots(selectedStaff?.id)
    }
  }, [selectedDate, selectedStaff, selectedService])

  // Reload occupied slots when entering appropriate step
  useEffect(() => {
    if (((step === 2 && !staffModuleEnabled) || (step === 3 && staffModuleEnabled)) && selectedService) {
      loadOccupiedSlots(selectedStaff?.id)
    }
  }, [step, selectedDate, selectedStaff, staffModuleEnabled, selectedService])

  // Generate available time slots based on schedule settings or staff schedule
  const generateTimeSlots = () => {
    const slots = []
    // Usar horarios del trabajador si están disponibles, sino usar los del negocio
    const schedule = staffSchedule || scheduleSettings
    
    // Si hay horarios específicos por día, usar los del día seleccionado
    if (staffSchedule?.workingHours && selectedDate) {
      const date = new Date(selectedDate)
      const dayOfWeek = date.getDay()
      const daySchedule = staffSchedule.workingHours.find((wh: any) => wh.dayOfWeek === dayOfWeek)
      
      if (daySchedule) {
        const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number)
        const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number)
        
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
    }
    
    // Usar horarios generales
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
    
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
    
    // Si hay horarios del trabajador, usar esos días
    if (staffSchedule?.workingDays) {
      return staffSchedule.workingDays.includes(dayOfWeek)
    }
    
    // Sino, usar los días del negocio
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
      
      // Mensaje específico si es por horario del trabajador
      const message = staffSchedule 
        ? `${selectedStaff?.name} ${t('doesNotWorkOn') || 'does not work on'} ${dayName}`
        : `${dayName} ${t('isNotWorkingDay')}`
      
      alert(message)
      
      // Find next working day
      let nextDate = new Date(newDate)
      const workingDays = staffSchedule?.workingDays || scheduleSettings.workingDays
      while (!workingDays.includes(nextDate.getDay())) {
        nextDate.setDate(nextDate.getDate() + 1)
      }
      setSelectedDate(nextDate.toISOString().split('T')[0])
    }
  }

  const handleSubmitBooking = async () => {
    // Create the appointment
    const newAppointment: any = {
      customerName: customerInfo.name,
      service: selectedService?.name || '',
      date: selectedDate,
      time: selectedTime,
      status: 'pending' as const,
      price: selectedService?.price || 0,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone
    }
    
    // Include staff ID if staff module is enabled and staff is selected
    if (staffModuleEnabled && selectedStaff) {
      newAppointment.staffId = selectedStaff.id
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
      const confirmationData: any = {
        customerName: customerInfo.name,
        service: selectedService?.name || '',
        date: selectedDate,
        time: selectedTime,
        businessName: businessInfo.name || 'Business'
      }
      
      // Include staff name if selected
      if (selectedStaff) {
        confirmationData.staffName = selectedStaff.name
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
            {staffModuleEnabled ? (
              <>
                <div className={`flex-1 ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'} h-2 rounded-l`} />
                <div className={`flex-1 mx-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'} h-2`} />
                <div className={`flex-1 mx-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'} h-2`} />
                <div className={`flex-1 ${step >= 4 ? 'bg-blue-600' : 'bg-gray-300'} h-2 rounded-r`} />
              </>
            ) : (
              <>
                <div className={`flex-1 ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'} h-2 rounded-l`} />
                <div className={`flex-1 mx-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'} h-2`} />
                <div className={`flex-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'} h-2 rounded-r`} />
              </>
            )}
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-sm ${step === 1 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              {t('selectService')}
            </span>
            {staffModuleEnabled && (
              <span className={`text-sm ${step === 2 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                {t('selectStaff') || 'Select Staff'}
              </span>
            )}
            <span className={`text-sm ${step === (staffModuleEnabled ? 3 : 2) ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              {t('selectDateTime')}
            </span>
            <span className={`text-sm ${step === (staffModuleEnabled ? 4 : 3) ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              {t('confirmBooking')}
            </span>
          </div>
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('selectService')}</h2>
            
            {/* Category filters */}
            {(() => {
              const categories = Array.from(new Set(
                services.map(s => s.category).filter(Boolean)
              )) as string[]
              
              if (categories.length > 1) {
                return (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedCategory === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {language === 'es' ? 'Todos' : 'All'}
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
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(() => {
                // Filter services by selected category
                const filteredServices = selectedCategory === 'all'
                  ? services
                  : services.filter(s => s.category === selectedCategory)
                
                // Group services by category if no filter applied and more than 10 services
                if (selectedCategory === 'all' && services.length > 10) {
                  const groupedServices: { [key: string]: Service[] } = {}
                  services.forEach((service) => {
                    const category = service.category || (language === 'es' ? 'Sin categoría' : 'Uncategorized')
                    if (!groupedServices[category]) {
                      groupedServices[category] = []
                    }
                    groupedServices[category].push(service)
                  })
                  
                  return Object.entries(groupedServices).map(([category, categoryServices]) => (
                    <div key={category} className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryServices.map((service) => (
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
                    </div>
                  ))
                } else {
                  // Show services without grouping
                  return filteredServices.map((service) => (
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
                  ))
                }
              })()}
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
                onClick={async () => {
                  if (selectedService) {
                    console.log('Selected service:', selectedService)
                    console.log('Staff module enabled:', staffModuleEnabled)
                    console.log('Service has assigned staff:', selectedService.assignedStaff)
                    
                    if (staffModuleEnabled) {
                      // Load staff for the selected service
                      try {
                        console.log('Loading staff for service:', selectedService.id)
                        const response = await fetch(`/api/public/staff/${businessId}?serviceId=${selectedService.id}`)
                        if (response.ok) {
                          const data = await response.json()
                          console.log('Staff data received:', data)
                          setAvailableStaff(data.staff || [])
                          if (data.staff && data.staff.length === 1) {
                            setSelectedStaff(data.staff[0])
                          }
                        } else {
                          console.error('Failed to load staff, status:', response.status)
                        }
                      } catch (error) {
                        console.error('Error loading staff:', error)
                      }
                      setStep(2) // Go to staff selection
                    } else {
                      console.log('Staff module not enabled, skipping to date/time selection')
                      setStep(2) // Go to date/time selection
                    }
                  }
                }}
                disabled={!selectedService}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('nextStep')}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Staff Selection (if enabled) */}
        {step === 2 && staffModuleEnabled && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t('selectStaffMember') || 'Select Staff Member'}
            </h2>
            {availableStaff.length > 0 ? (
              <div className="space-y-3">
                {availableStaff.map((staff) => (
                  <div
                    key={staff.id}
                    onClick={() => {
                      setSelectedStaff(staff)
                      // Si el trabajador tiene horarios específicos, usarlos
                      if (staff.workingHours && staff.workingHours.length > 0) {
                        const staffWorkingDays = staff.workingHours
                          .filter((wh: any) => wh.isActive !== false)
                          .map((wh: any) => wh.dayOfWeek)
                        
                        // Obtener el horario más temprano y más tarde
                        const startTimes = staff.workingHours.map((wh: any) => wh.startTime).sort()
                        const endTimes = staff.workingHours.map((wh: any) => wh.endTime).sort()
                        
                        setStaffSchedule({
                          workingDays: staffWorkingDays,
                          startTime: startTimes[0] || '09:00',
                          endTime: endTimes[endTimes.length - 1] || '18:00',
                          workingHours: staff.workingHours
                        })
                      } else {
                        setStaffSchedule(null) // Usar horarios del negocio
                      }
                    }}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedStaff?.id === staff.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {staff.photo && (
                        <img
                          src={staff.photo}
                          alt={staff.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{staff.name}</h3>
                        {staff.bio && (
                          <p className="text-sm text-gray-600 mt-1">{staff.bio}</p>
                        )}
                        {staff.specialties && staff.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {staff.specialties.map((specialty, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        )}
                        {staff.rating > 0 && (
                          <div className="flex items-center mt-2">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-600 ml-1">
                              {staff.rating.toFixed(1)} ({staff.totalReviews} {t('reviewsLower') || 'reviews'})
                            </span>
                          </div>
                        )}
                        {staff.workingHours && staff.workingHours.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {t('hasSpecificSchedule') || 'Has specific schedule'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {t('noStaffAvailableForService') || 'No staff members available for this service'}
              </p>
            )}
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('previousStep')}
              </button>
              <button
                onClick={() => {
                  loadOccupiedSlots(selectedStaff?.id)
                  setStep(3)
                }}
                disabled={!selectedStaff && availableStaff.length > 1}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('nextStep')}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time Selection */}
        {((step === 2 && !staffModuleEnabled) || (step === 3 && staffModuleEnabled)) && (
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
                onClick={() => setStep(staffModuleEnabled ? 2 : 1)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('previousStep')}
              </button>
              <button
                onClick={() => setStep(staffModuleEnabled ? 4 : 3)}
                disabled={!selectedDate || !selectedTime}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('nextStep')}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Contact Information & Confirmation */}
        {((step === 3 && !staffModuleEnabled) || (step === 4 && staffModuleEnabled)) && (
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
                {selectedStaff && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('staffNav') || 'Staff'}:</span>
                    <span className="font-medium">{selectedStaff.name}</span>
                  </div>
                )}
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
                onClick={() => setStep(staffModuleEnabled ? 3 : 2)}
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

