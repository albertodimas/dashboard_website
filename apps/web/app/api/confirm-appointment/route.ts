import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId } = body

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    // Find appointment in database
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: true,
        customer: true,
        business: true,
        staff: true
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check if already confirmed
    const alreadyConfirmed = appointment.status === 'CONFIRMED'

    if (!alreadyConfirmed) {
      // Update appointment status to confirmed
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED' }
      })
    }

    return NextResponse.json({
      success: true,
      alreadyConfirmed,
      appointment: {
        id: appointment.id,
        date: appointment.startTime.toISOString().split('T')[0],
        time: appointment.startTime.toTimeString().slice(0, 5),
        serviceName: appointment.service?.name || 'Service',
        staffName: appointment.staff?.name,
        customerName: appointment.customerName || appointment.customer?.name,
        businessName: appointment.business?.name,
        status: alreadyConfirmed ? 'CONFIRMED' : appointment.status
      }
    })
  } catch (error) {
    logger.error('Confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm appointment' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const appointmentId = searchParams.get('id')
    
    if (!appointmentId) {
      // Redirect to error page
      return NextResponse.redirect(new URL('/confirmation-error', request.url))
    }
    
    // Create a redirect URL with the appointment ID
    const confirmationUrl = new URL('/confirm', request.url)
    confirmationUrl.searchParams.set('id', appointmentId)
    
    // Redirect to client-side confirmation page
    return NextResponse.redirect(confirmationUrl)
    
  } catch (error) {
    logger.error('Error confirming appointment:', error)
    return NextResponse.redirect(new URL('/confirmation-error', request.url))
  }
}