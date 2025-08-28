import { notFound } from 'next/navigation'
import { prisma } from '@dashboard/db'
import BusinessLandingNew from '@/components/business/BusinessLandingNew'

interface CustomPageProps {
  params: {
    slug: string
  }
}

async function getBusinessByCustomSlug(customSlug: string) {
  try {
    const fullBusiness = await prisma.business.findFirst({
      where: {
        customSlug: customSlug,
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

    if (!fullBusiness) {
      return null
    }

    const appointmentCount = await prisma.appointment.count({
      where: {
        businessId: fullBusiness.id,
        status: 'COMPLETED'
      }
    })

    const reviews = await prisma.review.aggregate({
      where: {
        businessId: fullBusiness.id,
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
      ...fullBusiness,
      stats: {
        completedAppointments: appointmentCount,
        averageRating: reviews._avg.rating || 0,
        totalReviews: reviews._count.rating || 0
      }
    }
  } catch (error) {
    console.error('Error fetching business by custom slug:', error)
    return null
  }
}

export default async function CustomBusinessPage({ params }: CustomPageProps) {
  const business = await getBusinessByCustomSlug(params.slug)
  
  if (!business) {
    notFound()
  }

  return <BusinessLandingNew business={business} />
}

export async function generateMetadata({ params }: CustomPageProps) {
  const business = await getBusinessByCustomSlug(params.slug)

  if (!business) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.'
    }
  }

  return {
    title: `${business.name} - Professional Services`,
    description: business.description || `Visit ${business.name} for premium services. Book your appointment today!`,
    openGraph: {
      title: business.name,
      description: business.description,
      images: business.coverImage ? [business.coverImage] : [],
      type: 'website'
    },
    keywords: [
      business.name,
      business.city,
      'appointment',
      'booking',
      'services'
    ].filter(Boolean)
  }
}