import { notFound } from 'next/navigation'
import BusinessLandingEnhanced from '@/components/business/BusinessLandingEnhanced'
import { prisma } from '@dashboard/db'

interface CatchAllPageProps {
  params: {
    slug: string[]
  }
}

async function getBusinessByCustomSlug(customSlug: string) {
  try {
    const business = await prisma.business.findFirst({
      where: {
        customSlug: customSlug,
        isActive: true,
        isBlocked: false
      },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          include: {
            serviceStaff: {
              select: {
                staffId: true
              }
            }
          }
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
            settings: true,
            users: {
              where: {
                isAdmin: true
              },
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              },
              take: 1
            }
          }
        }
      }
    })

    if (!business) {
      return null
    }

    const appointmentCount = await prisma.appointment.count({
      where: {
        businessId: business.id,
        status: 'COMPLETED'
      }
    })

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
    console.error('Error fetching business by custom slug:', error)
    return null
  }
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  // Join the slug segments with /
  const fullSlug = params.slug.join('/')
  
  // Don't handle reserved routes
  const reservedFirstSegments = ['api', 'admin', 'dashboard', 'login', 'register', 'business', 'b', '_next', 'public', 'assets', 'cliente']
  if (reservedFirstSegments.includes(params.slug[0])) {
    notFound()
  }
  
  // Try to find business with this customSlug
  const business = await getBusinessByCustomSlug(fullSlug)
  
  if (!business) {
    notFound()
  }

  return <BusinessLandingEnhanced business={business} />
}

export async function generateMetadata({ params }: CatchAllPageProps) {
  const fullSlug = params.slug.join('/')
  const business = await getBusinessByCustomSlug(fullSlug)

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