import { notFound } from 'next/navigation'
import { prisma } from '@dashboard/db'
import BusinessLanding from '@/components/business/BusinessLanding'

interface CustomPageProps {
  params: {
    slug: string[]
  }
}

async function getBusinessByCustomSlug(customSlug: string) {
  try {
    // Use Prisma client directly now that customSlug field is recognized
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

    // Get appointment stats
    const appointmentCount = await prisma.appointment.count({
      where: {
        businessId: fullBusiness.id,
        status: 'COMPLETED'
      }
    })

    // Get average rating
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
  // Join the slug array to create the full path
  const fullSlug = params.slug.join('/')
  
  // Exclude API routes and other system routes - these should never reach this component
  if (fullSlug.startsWith('api/') || fullSlug.startsWith('_next/') || fullSlug.startsWith('dashboard/') || fullSlug.startsWith('login') || fullSlug.startsWith('register') || fullSlug.startsWith('admin/') || fullSlug.startsWith('client/')) {
    notFound()
  }
  
  // First, check if this is a custom business URL
  const business = await getBusinessByCustomSlug(fullSlug)
  
  if (!business) {
    // If no business found with this custom slug, return 404
    notFound()
  }

  // Debug log
  console.log('[SERVER CUSTOM PAGE] Business data for', fullSlug, {
    enablePackagesModule: business.enablePackagesModule,
    packagesCount: business.packages?.length || 0,
    packages: business.packages?.map((p: any) => ({ name: p.name, isActive: p.isActive })),
    reviewsCount: business.reviews?.length || 0,
    galleryItemsCount: business.galleryItems?.length || 0,
    staffCount: business.staff?.length || 0,
    workingHoursCount: business.workingHours?.length || 0,
    reviews: business.reviews?.slice(0, 2),
    galleryItems: business.galleryItems?.slice(0, 2)
  })

  return <BusinessLanding business={business} />
}

export async function generateMetadata({ params }: CustomPageProps) {
  const fullSlug = params.slug.join('/')
  
  // Exclude API routes and other system routes
  if (fullSlug.startsWith('api/') || fullSlug.startsWith('_next/') || fullSlug.startsWith('dashboard/') || fullSlug.startsWith('login') || fullSlug.startsWith('register') || fullSlug.startsWith('client/')) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.'
    }
  }
  
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