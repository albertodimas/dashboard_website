import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { z } from 'zod'
import { addMinutes, parseISO } from 'date-fns'
import { sendEmail } from '@/lib/email'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { getAppointmentConfirmationEmailTemplate } from '@/lib/email-templates'

const appointmentSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  packageId: z.string().uuid().optional(), // Add packageId for package bookings
  packagePurchaseId: z.string().uuid().optional(), // Add packagePurchaseId for using sessions
  usePackageSession: z.boolean().optional(), // Flag to indicate using package session
  staffId: z.string().uuid().optional(),
  date: z.string(),
  time: z.string(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7), // Changed from 10 to 7 for more flexibility
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP: max 5 bookings / 10 minutes
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'public:appointments:create', 5, 60 * 10)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many booking attempts', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 600) } }
      )
    }
    const body = await request.json()
    console.log('Received booking data:', body)
    const validated = appointmentSchema.parse(body)

    // Get service details for duration
    const service = await prisma.service.findUnique({
      where: { id: validated.serviceId },
      select: { 
        duration: true, 
        name: true, 
        price: true,
        businessId: true 
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Verify service belongs to business
    if (service.businessId !== validated.businessId) {
      return NextResponse.json(
        { error: 'Invalid service for this business' },
        { status: 400 }
      )
    }

    // Get a default staff if not provided
    let staffId = validated.staffId
    if (!staffId) {
      const defaultStaff = await prisma.staff.findFirst({
        where: { businessId: validated.businessId }
      })
      if (defaultStaff) {
        staffId = defaultStaff.id
      }
    }

    // Parse date and time
    const startTime = parseISO(`${validated.date}T${validated.time}`)
    const endTime = addMinutes(startTime, service.duration)

    // Check for existing appointments at this time
    // Use the staffId we determined (either provided or default)
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        businessId: validated.businessId,
        staffId: staffId, // Use the staffId variable, not validated.staffId
        status: { notIn: ['CANCELLED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          }
        ]
      }
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is not available' },
        { status: 409 }
      )
    }

    // Get business tenant ID
    const business = await prisma.business.findUnique({
      where: { id: validated.businessId },
      select: { tenantId: true }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Create or find customer
    let customer = await prisma.customer.findFirst({
      where: {
        email: validated.customerEmail,
        tenantId: business.tenantId
      }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: validated.customerName,
          email: validated.customerEmail,
          phone: validated.customerPhone,
          tenantId: business.tenantId
        }
      })
    }

    // Check for package booking and validate sessions
    let activePurchase = null
    
    // If using package session with packagePurchaseId
    if (validated.packagePurchaseId && validated.usePackageSession) {
      activePurchase = await prisma.packagePurchase.findUnique({
        where: { id: validated.packagePurchaseId },
        include: { package: true }
      })

      if (!activePurchase) {
        return NextResponse.json(
          { error: 'Package purchase not found' },
          { status: 404 }
        )
      }

      // Verify ownership
      if (activePurchase.customerId !== customer.id) {
        return NextResponse.json(
          { error: 'This package does not belong to you' },
          { status: 403 }
        )
      }

      // Check status and sessions
      if (activePurchase.status !== 'ACTIVE' || activePurchase.remainingSessions <= 0) {
        return NextResponse.json(
          { 
            error: 'No remaining sessions in this package',
            remainingSessions: activePurchase.remainingSessions
          },
          { status: 400 }
        )
      }

      // Check if expired
      if (activePurchase.expiryDate && new Date(activePurchase.expiryDate) < new Date()) {
        await prisma.packagePurchase.update({
          where: { id: activePurchase.id },
          data: { status: 'EXPIRED' }
        })

        return NextResponse.json(
          { error: 'Your package has expired' },
          { status: 400 }
        )
      }
    }
    // Legacy: If packageId is provided (old flow)
    else if (validated.packageId) {
      // Check if customer has an active package purchase
      activePurchase = await prisma.packagePurchase.findFirst({
        where: {
          customerId: customer.id,
          packageId: validated.packageId,
          businessId: validated.businessId,
          status: 'ACTIVE',
          remainingSessions: { gt: 0 }
        }
      })

      if (!activePurchase) {
        return NextResponse.json(
          { 
            error: 'No active package found or no remaining sessions. Please purchase a package first.',
            requiresPurchase: true
          },
          { status: 400 }
        )
      }

      // Check if the package has expired
      if (activePurchase.expiryDate && new Date(activePurchase.expiryDate) < new Date()) {
        // Mark as expired
        await prisma.packagePurchase.update({
          where: { id: activePurchase.id },
          data: { status: 'EXPIRED' }
        })

        return NextResponse.json(
          { 
            error: 'Your package has expired. Please purchase a new package.',
            requiresPurchase: true
          },
          { status: 400 }
        )
      }
    }

    // Ensure we have a staffId
    if (!staffId) {
      return NextResponse.json(
        { error: 'No staff available for this business' },
        { status: 400 }
      )
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        businessId: validated.businessId,
        customerId: customer.id,
        serviceId: validated.serviceId,
        packageId: validated.packageId || null,
        packagePurchaseId: activePurchase?.id || null,
        staffId: staffId, // Use the staffId we obtained earlier
        customerName: validated.customerName,  // Store the name used for this appointment
        customerPhone: validated.customerPhone, // Store the phone used for this appointment
        startTime,
        endTime,
        status: 'PENDING',
        price: (validated.packagePurchaseId && validated.usePackageSession) || validated.packageId ? 0 : service.price, // No price for package bookings
        totalAmount: (validated.packagePurchaseId && validated.usePackageSession) || validated.packageId ? 0 : service.price, // No total for package bookings
        notes: validated.notes,
        tenantId: business.tenantId
      },
      include: {
        service: { select: { name: true, duration: true } },
        staff: { select: { name: true } },
        business: { 
          select: { 
            name: true, 
            address: true,
            city: true,
            state: true,
            postalCode: true,
            phone: true
          } 
        }
      }
    })

    // Send confirmation email
    try {
      const confirmationLink = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/confirm?id=${appointment.id}`
      
      // Format address for email
      const businessAddress = [
        appointment.business.address,
        appointment.business.city,
        appointment.business.state,
        appointment.business.postalCode
      ].filter(Boolean).join(', ')
      
      const emailTemplate = getAppointmentConfirmationEmailTemplate({
        customerName: validated.customerName,
        businessName: appointment.business.name,
        serviceName: appointment.service.name,
        staffName: appointment.staff?.name,
        appointmentDate: startTime.toLocaleDateString('en-GB'), // Format as DD/MM/YYYY
        appointmentTime: validated.time,
        confirmationLink,
        businessAddress: businessAddress || appointment.business.name,
        businessPhone: appointment.business.phone || undefined
      })

      await sendEmail({
        to: validated.customerEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      })

      console.log('Confirmation email sent to:', validated.customerEmail)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the appointment creation if email fails
    }

    // If this is a package booking, consume a session
    if (activePurchase && (validated.usePackageSession || validated.packageId)) {
      try {
        // Use Prisma transaction to consume the session
        await prisma.$transaction(async (tx) => {
          // Create session usage record
          await tx.sessionUsage.create({
            data: {
              purchaseId: activePurchase.id,
              appointmentId: appointment.id,
              sessionNumber: activePurchase.usedSessions + 1,
              usedAt: new Date()
            }
          })

          // Update the purchase
          await tx.packagePurchase.update({
            where: { id: activePurchase.id },
            data: {
              usedSessions: activePurchase.usedSessions + 1,
              remainingSessions: activePurchase.remainingSessions - 1,
              status: activePurchase.remainingSessions - 1 === 0 ? 'COMPLETED' : 'ACTIVE'
            }
          })
        })
      } catch (sessionError) {
        console.error('Failed to consume session:', sessionError)
        // Consider whether to rollback the appointment or not
      }
    }

    // Customer stats fields don't exist in schema, skip this update

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        date: validated.date,
        time: validated.time,
        service: appointment.service.name,
        staff: appointment.staff?.name,
        status: appointment.status,
        remainingSessions: activePurchase ? activePurchase.remainingSessions - 1 : undefined
      },
      message: validated.packageId && activePurchase
        ? `Appointment booked successfully! ${activePurchase.remainingSessions - 1} sessions remaining.`
        : 'Appointment booked successfully!'
    })
  } catch (error) {
    console.error('Error creating appointment:', error)
    
    if (error instanceof z.ZodError) {
      // Provide more user-friendly error messages
      const errorMessages = error.errors.map(err => {
        if (err.path[0] === 'customerPhone') {
          return 'Phone number must be at least 7 digits'
        }
        if (err.path[0] === 'customerEmail') {
          return 'Please enter a valid email address'
        }
        if (err.path[0] === 'customerName') {
          return 'Name must be at least 2 characters'
        }
        return `Invalid ${err.path[0]}`
      })
      
      return NextResponse.json(
        { error: errorMessages.join(', '), details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create appointment. Please try again.' },
      { status: 500 }
    )
  }
}

// Get available time slots for a date
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const businessId = searchParams.get('businessId')
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date')
  const staffId = searchParams.get('staffId')

  if (!businessId || !serviceId || !date) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  try {
    // Get service duration and business settings
    const [service, business] = await Promise.all([
      prisma.service.findUnique({
        where: { id: serviceId },
        select: { duration: true }
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { settings: true }
      })
    ])

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get schedule settings from business - everything from database
    const settings = business.settings as any
    
    // If no settings exist, return empty (business must configure first)
    if (!settings || !settings.scheduleSettings) {
      console.log('No schedule settings found for business:', businessId)
      return NextResponse.json({ availableSlots: [] })
    }
    
    const scheduleSettings = settings.scheduleSettings

    // Get business working hours for the day
    // Use UTC day to avoid timezone issues with date-only strings
    const dayOfWeek = new Date(date + 'T00:00:00').getDay()
    
    // Check if staff module is enabled
    const businessDetails = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableStaffModule: true }
    })
    
    const staffModuleEnabled = businessDetails?.enableStaffModule || false
    
    // Get business-wide working hours first (only if staff module is enabled)
    let businessWorkingHours = null
    if (staffModuleEnabled) {
      businessWorkingHours = await prisma.workingHour.findFirst({
        where: {
          businessId,
          staffId: null,
          dayOfWeek
        }
      })
    }
    
    // Get staff-specific working hours if staffId is provided and staff module is enabled
    let staffWorkingHours = null
    if (staffId && staffModuleEnabled) {
      staffWorkingHours = await prisma.workingHour.findFirst({
        where: {
          businessId,
          staffId,
          dayOfWeek
        }
      })
    }
    
    // Determine business hours (from working hours or schedule settings)
    const businessStartTime = businessWorkingHours?.startTime || scheduleSettings.startTime
    const businessEndTime = businessWorkingHours?.endTime || scheduleSettings.endTime
    
    // If no business hours configured, return empty
    if (!businessStartTime || !businessEndTime) {
      console.log('No business hours configured for business:', businessId)
      return NextResponse.json({ availableSlots: [] })
    }
    
    // Check if business is open this day
    if (staffModuleEnabled) {
      // When staff module is enabled, check working hours
      if (businessWorkingHours && !businessWorkingHours.isActive) {
        return NextResponse.json({ availableSlots: [] })
      }
      // If no working hours found, business is closed
      if (!businessWorkingHours) {
        return NextResponse.json({ availableSlots: [] })
      }
    } else {
      // When staff module is disabled, use schedule settings
      if (!scheduleSettings.workingDays || !scheduleSettings.workingDays.includes(dayOfWeek)) {
        return NextResponse.json({ availableSlots: [] })
      }
    }
    
    // Determine effective working hours
    let startTimeStr = businessStartTime
    let endTimeStr = businessEndTime
    
    // If staff has specific hours, use the intersection with business hours
    if (staffWorkingHours) {
      // Check if staff is working this day
      if (!staffWorkingHours.isActive) {
        return NextResponse.json({ availableSlots: [] })
      }
      
      // Use the latest start time (intersection)
      const staffStartMinutes = parseInt(staffWorkingHours.startTime.split(':')[0]) * 60 + parseInt(staffWorkingHours.startTime.split(':')[1])
      const businessStartMinutes = parseInt(businessStartTime.split(':')[0]) * 60 + parseInt(businessStartTime.split(':')[1])
      
      // Use the earliest end time (intersection)
      const staffEndMinutes = parseInt(staffWorkingHours.endTime.split(':')[0]) * 60 + parseInt(staffWorkingHours.endTime.split(':')[1])
      const businessEndMinutes = parseInt(businessEndTime.split(':')[0]) * 60 + parseInt(businessEndTime.split(':')[1])
      
      // Take the most restrictive hours (intersection)
      const effectiveStartMinutes = Math.max(staffStartMinutes, businessStartMinutes)
      const effectiveEndMinutes = Math.min(staffEndMinutes, businessEndMinutes)
      
      // If no overlap, return empty
      if (effectiveStartMinutes >= effectiveEndMinutes) {
        return NextResponse.json({ availableSlots: [] })
      }
      
      startTimeStr = `${Math.floor(effectiveStartMinutes / 60).toString().padStart(2, '0')}:${(effectiveStartMinutes % 60).toString().padStart(2, '0')}`
      endTimeStr = `${Math.floor(effectiveEndMinutes / 60).toString().padStart(2, '0')}:${(effectiveEndMinutes % 60).toString().padStart(2, '0')}`
    }

    // Get existing appointments for the day
    const startOfDay = parseISO(`${date}T00:00:00`)
    const endOfDay = parseISO(`${date}T23:59:59`)

    // When staff module is disabled, get all appointments for the business
    // When enabled, get appointments for specific staff
    const appointmentFilter: any = {
      businessId,
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['CANCELLED'] }
    }
    
    // Only filter by staffId if staff module is enabled
    if (staffModuleEnabled && staffId) {
      appointmentFilter.staffId = staffId
    }
    
    const appointments = await prisma.appointment.findMany({
      where: appointmentFilter,
      orderBy: { startTime: 'asc' }
    })

    // Generate available time slots
    const slots = []
    // Use the times we determined above
    const startTime = parseISO(`${date}T${startTimeStr}`)
    const endTime = parseISO(`${date}T${endTimeStr}`)
    
    let currentTime = startTime
    const interval = scheduleSettings.timeInterval // Use from database, no defaults

    // Generate slots at regular intervals
    // Allow slots that start before closing time, even if they end slightly after
    while (currentTime < endTime) {
      const slotEnd = addMinutes(currentTime, service.duration)
      
      // Check for conflicts with existing appointments
      const hasConflict = appointments.some(apt => 
        (currentTime >= apt.startTime && currentTime < apt.endTime) ||
        (slotEnd > apt.startTime && slotEnd <= apt.endTime)
      )

      if (!hasConflict) {
        slots.push(currentTime.toTimeString().slice(0, 5))
      }

      // Move to next interval
      currentTime = addMinutes(currentTime, interval)
    }

    return NextResponse.json({ availableSlots: slots })
  } catch (error) {
    console.error('Error fetching available slots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    )
  }
}
