import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'

// GET reviews for a specific staff member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // Verify staff belongs to this business
    const staff = await prisma.staff.findFirst({
      where: {
        id: params.id,
        businessId: business.id
      }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const isPublished = searchParams.get('published') === 'true'

    const reviews = await prisma.staffReview.findMany({
      where: { 
        staffId: params.id,
        ...(isPublished && { isPublished: true })
      },
      include: {
        customer: {
          select: {
            name: true,
            avatar: true
          }
        },
        appointment: {
          select: {
            serviceId: true,
            startTime: true,
            service: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      reviews,
      stats: {
        totalReviews: reviews.length,
        averageRating: Math.round(avgRating * 10) / 10,
        ratings: {
          5: reviews.filter(r => r.rating === 5).length,
          4: reviews.filter(r => r.rating === 4).length,
          3: reviews.filter(r => r.rating === 3).length,
          2: reviews.filter(r => r.rating === 2).length,
          1: reviews.filter(r => r.rating === 1).length,
        }
      }
    })
  } catch (error) {
    console.error('Error fetching staff reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST respond to a review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const body = await request.json()
    const { reviewId, response } = body

    if (!reviewId || !response) {
      return NextResponse.json(
        { error: 'Review ID and response are required' },
        { status: 400 }
      )
    }

    // Verify review belongs to staff member of this business
    const review = await prisma.staffReview.findFirst({
      where: {
        id: reviewId,
        staffId: params.id,
        staff: {
          businessId: business.id
        }
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    const updatedReview = await prisma.staffReview.update({
      where: { id: reviewId },
      data: {
        response,
        respondedAt: new Date()
      }
    })

    return NextResponse.json(updatedReview)
  } catch (error) {
    console.error('Error responding to review:', error)
    return NextResponse.json(
      { error: 'Failed to respond to review' },
      { status: 500 }
    )
  }
}