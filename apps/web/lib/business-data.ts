import { prisma } from '@dashboard/db'

export async function getBusinessDataBySlug(slug: string) {
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
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                isAdmin: true
              },
              take: 1,
              orderBy: {
                isAdmin: 'desc' // Priorizar admin si existe, sino tomar el primer usuario
              }
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
    console.error('Error fetching business by slug:', error)
    return null
  }
}

export async function getBusinessDataByCustomSlug(customSlug: string) {
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
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                isAdmin: true
              },
              take: 1,
              orderBy: {
                isAdmin: 'desc' // Priorizar admin si existe, sino tomar el primer usuario
              }
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