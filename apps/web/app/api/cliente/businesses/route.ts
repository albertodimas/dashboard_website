import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [businesses API] Request received')
    
    // Verificar token desde cookies
    const token = request.cookies.get('client-token')?.value
    console.log('🔑 [businesses API] Cookie token:', token ? 'Present' : 'Missing')
    
    if (!token) {
      console.error('❌ [businesses API] No valid token cookie found')
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('🔐 [businesses API] Token recibido:', token.substring(0, 20) + '...')
    
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
      console.log('✅ [businesses API] Token decodificado exitosamente:', {
        customerId: decoded.customerId,
        email: decoded.email
      })
    } catch (error: any) {
      console.error('❌ [businesses API] Error verificando token:', error.message)
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Primero obtener el email del customer del token
    const customerEmail = decoded.email
    
    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Email no encontrado en el token' },
        { status: 400 }
      )
    }

    // Primero obtener un customer para tener la contraseña de referencia
    console.log('🔍 [businesses API] Buscando customer con ID:', decoded.customerId)
    const referenceCustomer = await prisma.customer.findUnique({
      where: { id: decoded.customerId }
    })
    
    if (!referenceCustomer) {
      console.error('❌ [businesses API] Cliente no encontrado con ID:', decoded.customerId)
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }
    
    console.log('✅ [businesses API] Reference customer encontrado:', {
      id: referenceCustomer.id,
      email: referenceCustomer.email,
      hasPassword: !!referenceCustomer.password
    })
    
    // Obtener la lista de negocios desregistrados desde metadata
    const customerMetadata = referenceCustomer.metadata as any || {}
    const unregisteredBusinesses = customerMetadata.unregisteredBusinesses || []
    console.log('🚫 [businesses API] Negocios desregistrados:', unregisteredBusinesses)
    
    // Buscar TODOS los customers con el mismo email y contraseña para el portal unificado
    const whereClause: any = {
      email: customerEmail.toLowerCase()
    }
    
    // Solo filtrar por contraseña si existe
    if (referenceCustomer.password) {
      whereClause.password = referenceCustomer.password
    }
    
    const allCustomersWithSameEmail = await prisma.customer.findMany({
      where: whereClause,
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
                logo: true,
                address: true,
                city: true,
                state: true,
                phone: true,
                email: true,
                slug: true,
                customSlug: true,
                businessType: true,
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

    console.log('📊 [businesses API] Customers encontrados con mismo email:', allCustomersWithSameEmail.length)
    allCustomersWithSameEmail.forEach(c => {
      console.log(`  📦 Customer en tenant: ${c.tenant.name} con ${c.tenant.businesses.length} negocios`)
    })
    
    // Combinar los negocios donde el cliente está registrado y contar appointments por customer
    const myBusinessesPromises = allCustomersWithSameEmail.flatMap(customer => 
      customer.tenant.businesses.map(async business => {
        // Contar appointments específicos de este customer en este negocio
        const appointmentCount = await prisma.appointment.count({
          where: {
            businessId: business.id,
            customerId: customer.id
          }
        })
        
        return {
          ...business,
          appointmentCount,
          serviceCount: business._count.services,
          customerId: customer.id // Incluir el customerId para este negocio
        }
      })
    )
    
    let myBusinesses = await Promise.all(myBusinessesPromises)
    
    // Filtrar los negocios desregistrados
    myBusinesses = myBusinesses.filter(business => !unregisteredBusinesses.includes(business.id))
    
    console.log('🎯 [businesses API] Total de negocios encontrados (después de filtrar desregistrados):', myBusinesses.length)
    if (myBusinesses.length > 0) {
      console.log('🏢 [businesses API] Negocios:', myBusinesses.map(b => ({ 
        name: b.name, 
        slug: b.customSlug || b.slug,
        customerId: b.customerId 
      })))
    }

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
        logo: true,
        address: true,
        city: true,
        state: true,
        phone: true,
        email: true,
        slug: true,
        customSlug: true,
        businessType: true,
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

    const response = {
      success: true,
      myBusinesses,
      suggestedBusinesses: suggestedWithRating
    }
    
    console.log('✅ [businesses API] Respuesta exitosa:', {
      myBusinessesCount: myBusinesses.length,
      suggestedBusinessesCount: suggestedWithRating.length
    })
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ [businesses API] Error completo:', error)
    console.error('❌ [businesses API] Stack trace:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: 'Error al obtener negocios' },
      { status: 500 }
    )
  }
}