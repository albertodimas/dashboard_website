import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { z } from 'zod'

const reviewSchema = z.object({
  appointmentId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = reviewSchema.parse(body)

    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: validated.appointmentId },
      include: {
        customer: true,
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
    if (appointment.review) {
      return NextResponse.json(
        { error: 'A review has already been submitted for this appointment' },
        { status: 400 }
      )
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        tenantId: appointment.tenantId,
        businessId: appointment.businessId,
        customerId: appointment.customerId,
        appointmentId: appointment.id,
        rating: validated.rating,
        comment: validated.comment,
        isPublished: true,
        publishedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment
      }
    })
  } catch (error) {
    console.error('Error submitting review:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}