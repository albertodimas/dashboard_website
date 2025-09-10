import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    // Verificar token - primero intentar leer de cookie, luego de header
    let token: string | undefined
    
    // Intentar leer de cookie
    const cookieToken = request.cookies.get('client-token')?.value
    
    // Si no hay cookie, intentar leer del header Authorization
    const authHeader = request.headers.get('authorization')
    
    if (cookieToken) {
      token = cookieToken
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener el ID del negocio de referencia si existe
    const referringBusinessId = request.cookies.get('referring-business')?.value

    // Buscar todos los customers con el mismo email en todos los tenants
    const allCustomers = await prisma.customer.findMany({
      where: {
        email: decoded.email
      },
      select: {
        id: true
      }
    })
    
    const customerIds = allCustomers.map(c => c.id)
    console.log('[Dashboard API] Found customers with same email:', customerIds.length)

    // Obtener paquetes activos de TODOS los customers con el mismo email
    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId: {
          in: customerIds
        },
        status: 'ACTIVE',
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } }
        ]
      },
      include: {
        package: {
          include: {
            business: {
              select: {
                name: true,
                slug: true,
                customSlug: true
              }
            },
            services: {
              include: {
                service: {
                  select: {
                    name: true,
                    duration: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        remainingSessions: 'desc'
      }
    })

    // Debug: Log del customerId
    console.log('[Dashboard API] CustomerId from token:', decoded.customerId)
    console.log('[Dashboard API] Using customerIds:', customerIds)
    
    // Obtener citas de TODOS los customers con el mismo email (excluyendo las canceladas)
    const appointments = await prisma.appointment.findMany({
      where: {
        customerId: {
          in: customerIds
        },
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        service: {
          select: {
            name: true,
            duration: true,
            price: true
          }
        },
        business: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            slug: true,
            customSlug: true
          }
        },
        staff: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'asc' // Ordenar ascendente para mostrar próximas citas primero
      }
    })
    
    console.log('[Dashboard API] Appointments found:', appointments.length)

    // Obtener datos del cliente
    console.log('[Dashboard API] Getting customer with ID:', decoded.customerId)
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        tenantId: true,
        createdAt: true
      }
    })
    console.log('[Dashboard API] Customer found:', customer ? 'Yes' : 'No')
    if (customer) {
      console.log('[Dashboard API] Customer name:', customer.name || 'NULL')
      console.log('[Dashboard API] Customer lastName:', customer.lastName || 'NULL')
      console.log('[Dashboard API] Customer email:', customer.email || 'NULL')
      console.log('[Dashboard API] Customer phone:', customer.phone || 'NULL')
      console.log('[Dashboard API] Customer address:', customer.address || 'NULL')
      console.log('[Dashboard API] Customer tenantId:', customer.tenantId || 'NULL')
    }

    // Obtener negocios donde el cliente está registrado (todos los del mismo tenant)
    const myBusinesses = customer?.tenantId ? await prisma.business.findMany({
      where: {
        tenantId: customer.tenantId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        slug: true,
        customSlug: true,
        imageUrl: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        rating: true,
        reviewCount: true,
        _count: {
          select: {
            services: true
          }
        }
      }
    }) : []

    // Obtener todos los negocios para explorar (de otros tenants)
    const businessesToExplore = customer?.tenantId ? await prisma.business.findMany({
      where: {
        tenantId: {
          not: customer.tenantId
        },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        slug: true,
        customSlug: true,
        imageUrl: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        rating: true,
        reviewCount: true,
        _count: {
          select: {
            services: true
          }
        }
      },
      take: 10 // Limitar a 10 negocios para explorar
    }) : []

    // Preparar la lista de negocios con información adicional
    const myBusinessesWithCounts = await Promise.all(
      myBusinesses.map(async (business) => {
        // Contar citas del cliente en este negocio
        const appointmentCount = await prisma.appointment.count({
          where: {
            customerId: {
              in: customerIds
            },
            businessId: business.id,
            status: {
              not: 'CANCELLED'
            }
          }
        })
        
        return {
          ...business,
          appointmentCount,
          serviceCount: business._count?.services || 0
        }
      })
    )
    
    // Ordenar paquetes y citas priorizando el negocio de referencia
    let sortedPackages = packages
    let sortedAppointments = appointments
    let sortedBusinesses = myBusinessesWithCounts

    if (referringBusinessId) {
      // Priorizar paquetes del negocio de referencia
      sortedPackages = [
        ...packages.filter(p => p.package.businessId === referringBusinessId),
        ...packages.filter(p => p.package.businessId !== referringBusinessId)
      ]

      // Priorizar citas del negocio de referencia
      sortedAppointments = [
        ...appointments.filter(a => a.businessId === referringBusinessId),
        ...appointments.filter(a => a.businessId !== referringBusinessId)
      ]

      // Priorizar el negocio de referencia en la lista de negocios
      sortedBusinesses = [
        ...myBusinessesWithCounts.filter(b => b.id === referringBusinessId),
        ...myBusinessesWithCounts.filter(b => b.id !== referringBusinessId)
      ]
    }

    return NextResponse.json({
      success: true,
      customer,
      packages: sortedPackages,
      appointments: sortedAppointments,
      myBusinesses: sortedBusinesses, // Negocios donde está registrado
      businessesToExplore, // Negocios para explorar
      referringBusinessId // ID del negocio desde donde accedió
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Error al cargar el dashboard' },
      { status: 500 }
    )
  }
}