import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  const appointmentId = params.appointmentId

  try {
    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: {
          select: { name: true }
        },
        staff: {
          select: { name: true }
        },
        business: {
          select: { name: true }
        },
        customer: {
          select: { name: true, email: true }
        },
        review: true
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check if appointment is completed
    if (appointment.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Reviews can only be submitted for completed appointments' },
        { status: 400 }
      )
    }

    // Check if review already exists
    const hasReview = !!appointment.review
    
    return NextResponse.json({
      id: appointment.id,
      service: appointment.service,
      staff: appointment.staff,
      business: appointment.business,
      startTime: appointment.startTime,
      hasReview,
      existingReview: hasReview ? {
        rating: appointment.review?.rating,
        comment: appointment.review?.comment
      } : null
    })
  } catch (error) {
    logger.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointment details' },
      { status: 500 }
    )
  }
}