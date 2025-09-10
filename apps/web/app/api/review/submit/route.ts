import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { z } from 'zod'
import { trackError } from '@/lib/observability'
import { getClientIP, limitByIP } from '@/lib/rate-limit'

const reviewSchema = z.object({
  appointmentId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP: 5 reviews / hour
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'public:review:submit', 5, 60 * 60)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many reviews from this IP', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 3600) } }
      )
    }
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
    trackError(error, { route: 'review/submit' })
    
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
