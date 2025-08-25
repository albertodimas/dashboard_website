import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { z } from 'zod'
import { addMinutes, parseISO } from 'date-fns'
import { sendEmail } from '@/lib/email'
import { getAppointmentConfirmationEmailTemplate } from '@/lib/email-templates'

const appointmentSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
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
        staffId: staffId, // Use the staffId we obtained earlier
        customerName: validated.customerName,  // Store the name used for this appointment
        customerPhone: validated.customerPhone, // Store the phone used for this appointment
        startTime,
        endTime,
        status: 'PENDING',
        price: service.price,
        totalAmount: service.price, // Fixed: using totalAmount instead of totalPrice
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

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        date: validated.date,
        time: validated.time,
        service: appointment.service.name,
        staff: appointment.staff?.name,
        status: appointment.status
      }
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
    
    // Try to get specific working hours for this day
    // If staffId is provided, prioritize staff-specific hours
    let workingHours = null
    if (staffId) {
      workingHours = await prisma.workingHour.findFirst({
        where: {
          businessId,
          staffId,
          dayOfWeek
        }
      })
    }
    
    // If no staff-specific hours, try business-wide hours
    if (!workingHours) {
      workingHours = await prisma.workingHour.findFirst({
        where: {
          businessId,
          staffId: null,
          dayOfWeek
        }
      })
    }
    
    // If no working hours found and no schedule settings working days, return empty
    if (!workingHours && (!scheduleSettings.workingDays || !scheduleSettings.workingDays.includes(dayOfWeek))) {
      return NextResponse.json({ availableSlots: [] })
    }

    // If no specific working hours, use schedule settings from database
    const startTimeStr = workingHours?.startTime || scheduleSettings.startTime
    const endTimeStr = workingHours?.endTime || scheduleSettings.endTime
    
    // If no times configured at all, return empty
    if (!startTimeStr || !endTimeStr) {
      console.log('No working hours configured for business:', businessId)
      return NextResponse.json({ availableSlots: [] })
    }
    
    // If working hours exist and day is not active, return empty
    if (workingHours && !workingHours.isActive) {
      return NextResponse.json({ availableSlots: [] })
    }

    // Get existing appointments for the day
    const startOfDay = parseISO(`${date}T00:00:00`)
    const endOfDay = parseISO(`${date}T23:59:59`)

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        staffId: staffId || undefined,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED'] }
      },
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