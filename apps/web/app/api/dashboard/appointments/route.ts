import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'

// GET all appointments
export async function GET() {
  try {
    // Get current business
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id
      },
      include: {
        customer: true,
        service: true,
        staff: true
      },
      orderBy: { startTime: 'desc' }
    })

    // Format appointments to match frontend structure
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      customerName: apt.customerName || apt.customer.name, // Use stored name or fallback to customer record
      customerEmail: apt.customer.email,
      customerPhone: apt.customerPhone || apt.customer.phone || '',
      service: apt.service.name,
      date: apt.startTime.toISOString().split('T')[0],
      time: apt.startTime.toTimeString().slice(0, 5),
      status: apt.status.toLowerCase(),
      price: apt.totalAmount,
      staffId: apt.staffId,
      staffName: apt.staff?.name
    }))

    return NextResponse.json(formattedAppointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// POST create appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get current business and staff
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // Get or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: business.tenantId,
        email: body.customerEmail
      }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: business.tenantId,
          email: body.customerEmail,
          name: body.customerName,
          phone: body.customerPhone
        }
      })
    }

    // Get service
    const service = await prisma.service.findFirst({
      where: {
        businessId: business.id,
        name: body.service
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Get staff - either specific staff if provided, or default
    let staff
    if (body.staffId) {
      // If staffId is provided, use that specific staff member
      staff = await prisma.staff.findFirst({
        where: { 
          id: body.staffId,
          businessId: business.id 
        }
      })
      
      if (!staff) {
        return NextResponse.json(
          { error: 'Selected staff member not found' },
          { status: 404 }
        )
      }
    } else {
      // Otherwise get default staff or create one
      staff = await prisma.staff.findFirst({
        where: { businessId: business.id }
      })

      if (!staff) {
        staff = await prisma.staff.create({
          data: {
            businessId: business.id,
            name: 'Default Staff',
            email: 'staff@dashboard.com'
          }
        })
      }
    }

    // Parse date and time
    const [year, month, day] = body.date.split('-').map(Number)
    const [hours, minutes] = body.time.split(':').map(Number)
    const startTime = new Date(year, month - 1, day, hours, minutes)
    const endTime = new Date(startTime.getTime() + service.duration * 60000)

    const appointment = await prisma.appointment.create({
      data: {
        tenantId: business.tenantId,
        businessId: business.id,
        customerId: customer.id,
        serviceId: service.id,
        staffId: staff.id,
        customerName: body.customerName,  // Store the name for this appointment
        customerPhone: body.customerPhone, // Store the phone for this appointment
        startTime,
        endTime,
        status: body.status?.toUpperCase() || 'PENDING',
        price: service.price,
        totalAmount: service.price
      },
      include: {
        customer: true,
        service: true,
        staff: true
      }
    })

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}

// PUT update appointment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    // Get the appointment first to get business info
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: body.id },
      include: { 
        business: true,
        customer: true,
        service: true
      }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    // Handle status changes
    if (body.status) {
      updateData.status = body.status.toUpperCase()
      
      // Update confirmation/cancellation timestamps
      if (body.status === 'confirmed') {
        updateData.confirmedAt = new Date()
      } else if (body.status === 'cancelled') {
        updateData.cancelledAt = new Date()
        updateData.cancellationReason = body.cancellationReason || 'Customer request'
      }
    }

    // Handle customer name change (update appointment record)
    if (body.customerName) {
      updateData.customerName = body.customerName
    }

    // Handle service change
    if (body.service && body.service !== existingAppointment.service.name) {
      const newService = await prisma.service.findFirst({
        where: {
          businessId: existingAppointment.businessId,
          name: body.service
        }
      })
      
      if (newService) {
        updateData.serviceId = newService.id
        // Also update price if service changed
        updateData.price = newService.price
        updateData.totalAmount = newService.price
        
        // Calculate new end time based on new service duration
        if (body.date && body.time) {
          const [year, month, day] = body.date.split('-').map(Number)
          const [hours, minutes] = body.time.split(':').map(Number)
          const startTime = new Date(year, month - 1, day, hours, minutes)
          const endTime = new Date(startTime.getTime() + newService.duration * 60000)
          updateData.startTime = startTime
          updateData.endTime = endTime
        }
      }
    }

    // Handle date/time change
    if (body.date && body.time) {
      const [year, month, day] = body.date.split('-').map(Number)
      const [hours, minutes] = body.time.split(':').map(Number)
      const startTime = new Date(year, month - 1, day, hours, minutes)
      
      // Get service duration for end time calculation
      const serviceToUse = updateData.serviceId 
        ? await prisma.service.findUnique({ where: { id: updateData.serviceId } })
        : existingAppointment.service
      
      const duration = serviceToUse?.duration || 60
      const endTime = new Date(startTime.getTime() + duration * 60000)
      
      updateData.startTime = startTime
      updateData.endTime = endTime
    }

    // Handle price change
    if (body.price !== undefined && body.price !== existingAppointment.price) {
      updateData.price = body.price
      updateData.totalAmount = body.price
    }

    const appointment = await prisma.appointment.update({
      where: { id: body.id },
      data: updateData,
      include: {
        customer: true,
        service: true,
        staff: true
      }
    })

    // Format response to match frontend structure
    const formattedAppointment = {
      id: appointment.id,
      customerName: appointment.customer.name,
      customerEmail: appointment.customer.email,
      customerPhone: appointment.customer.phone || '',
      service: appointment.service.name,
      date: appointment.startTime.toISOString().split('T')[0],
      time: appointment.startTime.toTimeString().slice(0, 5),
      status: appointment.status.toLowerCase(),
      price: appointment.totalAmount,
      staffId: appointment.staffId,
      staffName: appointment.staff?.name
    }

    return NextResponse.json(formattedAppointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

// DELETE appointment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    await prisma.appointment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}