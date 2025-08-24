import { notFound } from 'next/navigation'
import { prisma } from '@dashboard/db'
import BusinessLanding from '@/components/business/BusinessLanding'

interface BusinessPageProps {
  params: {
    slug: string
  }
}

async function getBusinessData(slug: string) {
  try {
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
        staff: {
          where: { isActive: true }
        },
        galleryItems: true,
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
            settings: true
          }
        }
      }
    })

    if (!business) {
      return null
    }

    // Get appointment stats
    const appointmentCount = await prisma.appointment.count({
      where: {
        businessId: business.id,
        status: 'COMPLETED'
      }
    })

    // Get average rating
    const reviews = await prisma.review.aggregate({
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

    return {
      ...business,
      stats: {
        completedAppointments: appointmentCount,
        averageRating: reviews._avg.rating || 0,
        totalReviews: reviews._count.rating || 0
      }
    }
  } catch (error) {
    console.error('Error fetching business:', error)
    return null
  }
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const business = await getBusinessData(params.slug)

  if (!business) {
    notFound()
  }

  return <BusinessLanding business={business} />
}

export async function generateMetadata({ params }: BusinessPageProps) {
  const business = await getBusinessData(params.slug)

  if (!business) {
    return {
      title: 'Business Not Found',
      description: 'The requested business page could not be found.'
    }
  }

  return {
    title: `${business.name} - Professional ${business.category || 'Services'}`,
    description: business.description || `Visit ${business.name} for premium services. Book your appointment today!`,
    openGraph: {
      title: business.name,
      description: business.description,
      images: business.coverImage ? [business.coverImage] : [],
      type: 'website'
    },
    keywords: [
      business.name,
      business.category,
      business.city,
      'appointment',
      'booking',
      'services'
    ].filter(Boolean)
  }
}