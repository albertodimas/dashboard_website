import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import jwt from 'jsonwebtoken'

const CLIENT_JWT_SECRET = process.env.CLIENT_JWT_SECRET || 'development-client-jwt-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    // Verificar token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, CLIENT_JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener el cliente actual con su tenant y negocios
    const currentCustomer = await prisma.customer.findUnique({
      where: {
        id: decoded.customerId
      },
      include: {
        tenant: {
          include: {
            businesses: {
              where: {
                isActive: true,
                isBlocked: false
              },
              select: {
                id: true,
                name: true,
                description: true,
                address: true,
                city: true,
                state: true,
                phone: true,
                email: true,
                slug: true,
                customSlug: true,
                businessCategory: true,
                categoryId: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    icon: true,
                    color: true
                  }
                },
                _count: {
                  select: {
                    services: true,
                    appointments: {
                      where: {
                        customerId: decoded.customerId
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!currentCustomer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Buscar otros customers con el mismo email y password para el portal unificado
    const otherCustomers = await prisma.customer.findMany({
      where: {
        email: currentCustomer.email,
        password: currentCustomer.password, // Solo si tienen la misma contraseña
        id: {
          not: currentCustomer.id // Excluir el customer actual
        }
      },
      include: {
        tenant: {
          include: {
            businesses: {
              where: {
                isActive: true,
                isBlocked: false
              },
              select: {
                id: true,
                name: true,
                description: true,
                address: true,
                city: true,
                state: true,
                phone: true,
                email: true,
                slug: true,
                customSlug: true,
                businessCategory: true,
                categoryId: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    icon: true,
                    color: true
                  }
                },
                _count: {
                  select: {
                    services: true,
                    appointments: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Combinar los negocios donde el cliente está registrado
    const myBusinesses = [
      ...currentCustomer.tenant.businesses.map(business => ({
        ...business,
        appointmentCount: business._count.appointments,
        serviceCount: business._count.services,
        customerId: currentCustomer.id // Incluir el customerId para este negocio
      })),
      ...otherCustomers.flatMap(customer => 
        customer.tenant.businesses.map(business => ({
          ...business,
          appointmentCount: business._count.appointments,
          serviceCount: business._count.services,
          customerId: customer.id // Incluir el customerId para este negocio
        }))
      )
    ]

    // Obtener las categorías de los negocios donde ya está registrado
    const existingCategoryIds = myBusinesses
      .map(b => b.categoryId)
      .filter(Boolean) // Eliminar nulls

    // Obtener IDs de negocios donde ya está registrado
    const registeredBusinessIds = myBusinesses.map(b => b.id)

    // Obtener negocios sugeridos (de diferentes categorías y donde no está registrado)
    const suggestedBusinesses = await prisma.business.findMany({
      where: {
        isActive: true,
        isBlocked: false,
        // Excluir negocios donde ya está registrado
        NOT: {
          id: {
            in: registeredBusinessIds
          }
        },
        // Excluir categorías donde ya tiene negocios
        ...(existingCategoryIds.length > 0 && {
          OR: [
            { categoryId: null },
            {
              NOT: {
                categoryId: {
                  in: existingCategoryIds
                }
              }
            }
          ]
        })
      },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        state: true,
        phone: true,
        email: true,
        slug: true,
        customSlug: true,
        businessCategory: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true
          }
        },
        isPremium: true,
        _count: {
          select: {
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
        { isPremium: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10 // Limitar a 10 sugerencias
    })

    // Calcular rating promedio para negocios sugeridos
    const suggestedWithRating = suggestedBusinesses.map(business => {
      const avgRating = business.reviews.length > 0
        ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / business.reviews.length
        : 0
      
      return {
        ...business,
        rating: avgRating,
        reviewCount: business._count.reviews,
        serviceCount: business._count.services
      }
    })

    return NextResponse.json({
      success: true,
      myBusinesses,
      suggestedBusinesses: suggestedWithRating
    })
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json(
      { error: 'Error al obtener negocios' },
      { status: 500 }
    )
  }
}