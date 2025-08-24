import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const businessId = searchParams.get('businessId')
  
  if (!businessId) {
    return NextResponse.json(
      { error: 'Business ID is required' },
      { status: 400 }
    )
  }

  try {
    const reviews = await prisma.review.findMany({
      where: {
        businessId,
        isPublished: true
      },
      include: {
        customer: {
          select: {
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}