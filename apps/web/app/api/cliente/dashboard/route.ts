import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { verifyClientToken } from '@/lib/client-auth'
import { SignJWT } from 'jose'

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

    const decoded = await verifyClientToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
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
                id: true,
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
    let customer = await prisma.customer.findUnique({
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

    // Si el customer no existe o está incompleto, buscar el candidato más completo del mismo email
    let issuedFreshTokenForCustomerId: string | null = null
    if (!customer || !customer.name || !(customer.lastName ?? '').toString().trim()) {
      if (decoded.email) {
        const candidates = await prisma.customer.findMany({
          where: { email: decoded.email.toLowerCase() },
          orderBy: { createdAt: 'desc' }
        })
        if (candidates.length > 0) {
          const getScore = (c: any) =>
            (c.name && c.name.trim() ? 1 : 0) +
            (c.lastName && String(c.lastName).trim() ? 1 : 0) +
            (c.phone && String(c.phone).trim() ? 1 : 0) +
            (customer?.tenantId && c.tenantId === customer?.tenantId ? 2 : 0)
          const best = candidates.reduce((a, b) => (getScore(b) > getScore(a) ? b : a), candidates[0])

          if (customer) {
            const data: any = {}
            if (!customer.name && best.name) data.name = best.name
            if (!(customer.lastName ?? '').toString().trim() && (best as any).lastName) data.lastName = (best as any).lastName
            if (!customer.phone && (best as any).phone) data.phone = (best as any).phone
            if (!customer.address && (best as any).address) data.address = (best as any).address
            if (!customer.city && (best as any).city) data.city = (best as any).city
            if (!customer.state && (best as any).state) data.state = (best as any).state
            if (!customer.postalCode && (best as any).postalCode) data.postalCode = (best as any).postalCode
            if (Object.keys(data).length > 0) {
              customer = await prisma.customer.update({ where: { id: customer.id }, data, select: {
                id: true, name: true, lastName: true, email: true, phone: true, address: true,
                city: true, state: true, postalCode: true, tenantId: true, createdAt: true
              } })
              console.log('[Dashboard API] Perfil completado desde otro registro por email')
            }
          } else {
            // No existe el registro con el id del token (posible cambio reciente). Usar el más completo como fallback
            customer = best as any
            console.warn('[Dashboard API] Usando cliente alternativo por email (id no encontrado)')
          }
          // Emitir nuevo token si el id final difiere del token recibido
          if (customer && decoded.customerId !== customer.id) {
            const secretStr = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET
            if (secretStr) {
              const token = await new SignJWT({
                customerId: customer.id,
                email: customer.email,
                name: customer.name,
                emailVerified: true
              } as Record<string, unknown>)
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('1h')
                .sign(new TextEncoder().encode(secretStr))
              issuedFreshTokenForCustomerId = customer.id
              // Attach new token to cookies in response later
              // We defer setting cookie until we create the response object
              ;
            }
          }
        }
      }
    }

    // Fallback final: si seguimos sin customer pero tenemos IDs, traer el primero
    if (!customer && customerIds.length > 0) {
      customer = await prisma.customer.findUnique({
        where: { id: customerIds[0] },
        select: {
          id: true, name: true, lastName: true, email: true, phone: true,
          address: true, city: true, state: true, postalCode: true, tenantId: true, createdAt: true
        }
      })
      console.warn('[Dashboard API] Fallback: usando primer customerId por email')
    }

    // Obtener negocios donde el cliente está registrado (cruzando BusinessCustomer)
    const relations = await prisma.businessCustomer.findMany({
      where: {
        customerId: { in: customerIds },
        isActive: true
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            description: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            slug: true,
            customSlug: true,
            imageUrl: true,
            category: {
              select: { id: true, name: true, slug: true }
            },
            rating: true,
            reviewCount: true,
            _count: { select: { services: true } }
          }
        }
      }
    })

    // Normalizar y deduplicar por business.id
    const seen = new Set<string>()
    const myBusinesses = relations
      .filter(r => !!r.business)
      .map(r => ({
        ...r.business,
        lastVisit: r.lastVisit,
        totalVisits: r.totalVisits
      }))
      .filter(b => {
        if (seen.has(b.id)) return false
        seen.add(b.id)
        return true
      })

    // Obtener todos los negocios para explorar (de otros tenants)
    const registeredIds = myBusinesses.map(b => b.id)
    const businessesToExplore = await prisma.business.findMany({
      where: {
        isActive: true,
        isBlocked: false,
        id: { notIn: registeredIds }
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
        slug: true,
        customSlug: true,
        imageUrl: true,
        category: { select: { id: true, name: true, slug: true } },
        rating: true,
        reviewCount: true,
        _count: { select: { services: true } }
      },
      take: 10
    })

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
        ...packages.filter(p => (p as any)?.package?.business?.id === referringBusinessId),
        ...packages.filter(p => (p as any)?.package?.business?.id !== referringBusinessId)
      ]

      // Priorizar citas del negocio de referencia
      sortedAppointments = [
        ...appointments.filter(a => (a as any).businessId === referringBusinessId),
        ...appointments.filter(a => (a as any).businessId !== referringBusinessId)
      ]

      // Priorizar el negocio de referencia en la lista de negocios
      sortedBusinesses = [
        ...myBusinessesWithCounts.filter(b => b.id === referringBusinessId),
        ...myBusinessesWithCounts.filter(b => b.id !== referringBusinessId)
      ]
    }

    const response = NextResponse.json({
      success: true,
      customer,
      packages: sortedPackages,
      appointments: sortedAppointments,
      myBusinesses: sortedBusinesses, // Negocios donde está registrado
      businessesToExplore, // Negocios para explorar
      referringBusinessId // ID del negocio desde donde accedió
    })

    if (issuedFreshTokenForCustomerId) {
      // Set updated access token to align future requests
      response.cookies.set('client-token', (await (async () => {
        const secretStr = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET!
        return await new SignJWT({
          customerId: customer!.id,
          email: customer!.email,
          name: customer!.name,
          emailVerified: true
        } as Record<string, unknown>)
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('1h')
          .sign(new TextEncoder().encode(secretStr))
      })()), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/'
      })
    }

    return response

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Error al cargar el dashboard' },
      { status: 500 }
    )
  }
}
