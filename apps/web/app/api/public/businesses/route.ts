import { NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { logger } from '@/lib/logger'

// GET all active businesses for public directory
export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      where: {
        isActive: true, // Only show active businesses
        isBlocked: false // Don't show blocked businesses
      },
      include: {
        _count: {
          select: {
            appointments: true,
            services: true,
            reviews: {
              where: {
                isPublished: true
              }
            }
          }
        },
        reviews: {
          where: {
            isPublished: true
          },
          select: {
            rating: true
          }
        }
      },
      orderBy: [
        { isPremium: 'desc' }, // Premium businesses first
        { createdAt: 'desc' }
      ]
    })

    // Format businesses for public display
    const formattedBusinesses = businesses.map(business => {
      // Calculate average rating
      const avgRating = business.reviews.length > 0
        ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / business.reviews.length
        : 0

      return {
        id: business.id,
        slug: business.slug,
        name: business.name,
        description: business.description || 'Professional services',
        category: 'Services', // You can add a category field to the business model later
        address: `${business.address}, ${business.city}, ${business.state} ${business.postalCode}`,
        city: business.city,
        state: business.state,
        phone: business.phone,
        email: business.email,
        website: business.website,
        rating: avgRating,
        reviews: business._count.reviews,
        servicesCount: business._count.services,
        isPremium: business.isPremium,
        logo: business.logo,
        coverImage: business.coverImage
      }
    })

    return NextResponse.json(formattedBusinesses)
  } catch (error) {
    logger.error('Error fetching businesses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    )
  }
}