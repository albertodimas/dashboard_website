import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

// GET public business information by slug
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    
    // Get business by slug with all relations
    const business = await prisma.business.findFirst({
      where: { 
        slug: slug,
        isActive: true,
        isBlocked: false
      },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        packages: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            services: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    duration: true,
                    price: true
                  }
                }
              }
            }
          }
        },
        staff: {
          where: { isActive: true }
        },
        galleryItems: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        workingHours: {
          orderBy: { dayOfWeek: 'asc' }
        },
        reviews: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            customer: {
              select: {
                name: true
              }
            }
          }
        },
        tenant: {
          select: {
            settings: true,
            users: {
              where: { isAdmin: true },
              take: 1,
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ 
        error: 'Business not found',
        business: null 
      }, { status: 404 })
    }

    // Get stats
    const appointmentCount = await prisma.appointment.count({
      where: {
        businessId: business.id,
        status: 'COMPLETED'
      }
    })

    const reviewStats = await prisma.review.aggregate({
      where: {
        businessId: business.id,
        isPublished: true
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    })

    // Get the owner from the tenant's users
    const owner = business.tenant.users[0] || null
    
    // Return complete business information
    return NextResponse.json({
      ...business,
      owner: owner,
      stats: {
        completedAppointments: appointmentCount,
        averageRating: reviewStats._avg.rating || 0,
        totalReviews: reviewStats._count.rating || 0
      }
    })
  } catch (error) {
    console.error('Error fetching business:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business information' },
      { status: 500 }
    )
  }
}