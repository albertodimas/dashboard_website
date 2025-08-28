import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')
    const serviceId = searchParams.get('serviceId')
    const date = searchParams.get('date')
    
    if (!businessId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'Business ID, Service ID, and date are required' },
        { status: 400 }
      )
    }

    // Get business settings and working hours
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        workingHours: true
      }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Get existing appointments for the date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW']
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Generate available time slots
    const dayOfWeek = startOfDay.getDay()
    const workingHour = business.workingHours.find(wh => 
      wh.dayOfWeek === dayOfWeek && wh.isActive
    )

    if (!workingHour) {
      return NextResponse.json({ availableSlots: [] })
    }

    // Get business hours settings
    const scheduleSettings = business.settings?.scheduleSettings as any || {
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30
    }

    const startTime = workingHour.startTime || scheduleSettings.startTime || '09:00'
    const endTime = workingHour.endTime || scheduleSettings.endTime || '17:00'
    const slotDuration = scheduleSettings.slotDuration || 30

    // Generate all possible slots
    const availableSlots: string[] = []
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    
    const currentDate = new Date()
    const isToday = startOfDay.toDateString() === currentDate.toDateString()
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        if (hour === endHour && minute >= endMinute) break
        if (hour === startHour && minute < startMinute) continue
        
        // Skip past times if it's today
        if (isToday) {
          const slotTime = new Date(startOfDay)
          slotTime.setHours(hour, minute, 0, 0)
          if (slotTime <= currentDate) continue
        }
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        // Check if this slot conflicts with existing appointments
        const slotStart = new Date(startOfDay)
        slotStart.setHours(hour, minute, 0, 0)
        
        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + service.duration)
        
        const hasConflict = existingAppointments.some(apt => {
          const aptStart = new Date(apt.startTime)
          const aptEnd = new Date(apt.endTime)
          
          return (
            (slotStart >= aptStart && slotStart < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotStart <= aptStart && slotEnd >= aptEnd)
          )
        })
        
        if (!hasConflict) {
          availableSlots.push(timeString)
        }
      }
    }

    return NextResponse.json({
      availableSlots,
      date,
      businessId,
      serviceId
    })

  } catch (error) {
    console.error('Error fetching available slots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    )
  }
}