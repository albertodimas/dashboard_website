import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { verifyClientToken } from '@/lib/client-auth'
import { SignJWT } from 'jose'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  let step = 'start'
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

    step = 'verify-token'
    const decoded = await verifyClientToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener el negocio de referencia desde cookie o query `from`
    step = 'resolve-referrer'
    let referringBusinessId = request.cookies.get('referring-business')?.value as string | undefined
    if (!referringBusinessId) {
      try {
        const url = new URL(request.url)
        const from = url.searchParams.get('from')
        if (from) {
          const decodedFrom = decodeURIComponent(from)
          const extractSlug = (path: string): string | undefined => {
            const bizMatch = path.match(/\/(?:business|b)\/([^\/\?#]+)/)
            if (bizMatch && bizMatch[1]) return bizMatch[1]
            const dirMatch = path.match(/^\/([^\/\?#]+)/)
            if (dirMatch && dirMatch[1] !== 'cliente') return dirMatch[1]
            return undefined
          }
          let slug: string | undefined
          if (decodedFrom.includes('://')) {
            const u = new URL(decodedFrom)
            slug = extractSlug(u.pathname)
          } else if (decodedFrom.startsWith('/')) {
            slug = extractSlug(decodedFrom)
          } else {
            slug = decodedFrom
          }
          if (slug) {
            const biz = await prisma.business.findFirst({ where: { OR: [{ slug }, { customSlug: slug }] }, select: { id: true } })
            if (biz) referringBusinessId = biz.id
          }
        }
      } catch {}
    }

    // Lista de negocios desregistrados por el usuario (preferencias en metadata)
    step = 'load-unregistered'
    let unregistered: string[] = []
    try {
      const meta = await prisma.customer.findUnique({ where: { id: decoded.customerId }, select: { metadata: true } })
      unregistered = ((meta?.metadata as any)?.unregisteredBusinesses || []) as string[]
    } catch {}

    // Buscar todos los customers con el mismo email en todos los tenants
    step = 'fetch-customers-by-email'
    const allCustomers = await prisma.customer.findMany({
      where: {
        email: decoded.email
      },
      select: {
        id: true
      }
    })
    
    const customerIds = allCustomers.map(c => c.id)
    logger.info('[Dashboard API] Found customers with same email:', customerIds.length)

    // Obtener paquetes activos de TODOS los customers con el mismo email
    step = 'fetch-packages'
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
    logger.info('[Dashboard API] CustomerId from token:', decoded.customerId)
    logger.info('[Dashboard API] Using customerIds:', customerIds)
    
    // Obtener citas de TODOS los customers con el mismo email (excluyendo las canceladas)
    step = 'fetch-appointments'
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
    
    logger.info('[Dashboard API] Appointments found:', appointments.length)

    // Crear/activar relaciones BusinessCustomer a partir de actividad (paquetes/citas) si no existen
    try {
      step = 'ensure-relations-from-activity'
      const wantedPairs = new Map<string, { businessId: string; customerId: string }>()
      for (const p of packages as any[]) {
        const b = p?.package?.business
        const cId = p?.customerId
        if (b?.id && cId && !unregistered.includes(b.id)) {
          wantedPairs.set(`${b.id}:${cId}`, { businessId: b.id, customerId: cId })
        }
      }
      for (const a of appointments as any[]) {
        const bId = (a as any)?.business?.id || (a as any)?.businessId
        const cId = (a as any)?.customerId
        if (bId && cId && !unregistered.includes(bId)) {
          wantedPairs.set(`${bId}:${cId}`, { businessId: bId, customerId: cId })
        }
      }
      if (wantedPairs.size > 0) {
        await Promise.allSettled(
          Array.from(wantedPairs.values()).map(({ businessId, customerId }) =>
            prisma.businessCustomer.upsert({
              where: { businessId_customerId: { businessId, customerId } },
              update: { isActive: true, lastVisit: new Date() },
              create: { businessId, customerId, isActive: true, lastVisit: new Date(), totalVisits: 1 },
            })
          )
        )
      }
    } catch (e) {
      logger.warn('[Dashboard API] ensure via activity failed:', (e as any)?.message || e)
    }

    // Obtener datos del cliente
    step = 'fetch-customer'
    logger.info('[Dashboard API] Getting customer with ID:', decoded.customerId)
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
    logger.info('[Dashboard API] Customer found:', customer ? 'Yes' : 'No')
    if (customer) {
      logger.info('[Dashboard API] Customer name:', customer.name || 'NULL')
      logger.info('[Dashboard API] Customer lastName:', customer.lastName || 'NULL')
      logger.info('[Dashboard API] Customer email:', customer.email || 'NULL')
      logger.info('[Dashboard API] Customer phone:', customer.phone || 'NULL')
      logger.info('[Dashboard API] Customer address:', customer.address || 'NULL')
      logger.info('[Dashboard API] Customer tenantId:', customer.tenantId || 'NULL')
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
              logger.info('[Dashboard API] Perfil completado desde otro registro por email')
            }
          } else {
            // No existe el registro con el id del token (posible cambio reciente). Usar el más completo como fallback
            customer = best as any
            logger.warn('[Dashboard API] Usando cliente alternativo por email (id no encontrado)')
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
      step = 'fallback-customer'
      customer = await prisma.customer.findUnique({
        where: { id: customerIds[0] },
        select: {
          id: true, name: true, lastName: true, email: true, phone: true,
          address: true, city: true, state: true, postalCode: true, tenantId: true, createdAt: true
        }
      })
      logger.warn('[Dashboard API] Fallback: usando primer customerId por email')
    }

    // Ensure BusinessCustomer link for referring business (if any) for this customer (respect unregistered)
    step = 'ensure-relation'
    if (referringBusinessId && !unregistered.includes(referringBusinessId)) {
      try {
        const existing = await prisma.businessCustomer.findUnique({
          where: { businessId_customerId: { businessId: referringBusinessId, customerId: decoded.customerId } },
          select: { isActive: true }
        })
        if (!existing) {
          await prisma.businessCustomer.create({
            data: {
              businessId: referringBusinessId,
              customerId: decoded.customerId,
              isActive: true,
              lastVisit: new Date(),
              totalVisits: 1,
            }
          })
        } else {
          await prisma.businessCustomer.update({
            where: { businessId_customerId: { businessId: referringBusinessId, customerId: decoded.customerId } },
            data: { isActive: true, lastVisit: new Date(), totalVisits: { increment: 1 } }
          })
        }
      } catch (e) {
        logger.warn('[Dashboard API] ensure BusinessCustomer failed:', (e as any)?.message || e)
      }
    }
 
    // Obtener negocios donde el cliente está registrado (cruzando BusinessCustomer)
    step = 'fetch-relations'
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
            logo: true,
            coverImage: true,
            description: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            slug: true,
            customSlug: true,
            // imageUrl not in schema; UI uses logo/coverImage
            category: {
              select: { id: true, name: true, slug: true }
            },
            _count: { select: { services: true } }
          }
        }
      }
    })

    // Filter unregistered businesses (by customer's metadata) and deduplicate by business.id
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
      .filter(b => !unregistered.includes(b.id))

    // Obtener todos los negocios para explorar (de otros tenants)
    const registeredIds = myBusinesses.map(b => b.id)
    step = 'fetch-explore'
    const businessesToExplore = await prisma.business.findMany({
      where: {
        isActive: true,
        isBlocked: false,
        id: { notIn: registeredIds }
      },
      select: {
        id: true,
        name: true,
        logo: true,
        coverImage: true,
        description: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        slug: true,
        customSlug: true,
        // imageUrl not in schema; UI uses logo/coverImage
        category: { select: { id: true, name: true, slug: true } },
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

    step = 'prepare-response'
    const response = NextResponse.json({
      success: true,
      customer,
      packages: sortedPackages,
      appointments: sortedAppointments,
      myBusinesses: sortedBusinesses,
      businessesToExplore, // Negocios para explorar
      referringBusinessId // ID del negocio desde donde accedió
    })

    if (issuedFreshTokenForCustomerId) {
      // Set updated access token to align future requests
      response.cookies.set('client-token', (await (async () => {
        const secretStr = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET!
        return new SignJWT({
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
    logger.error('Dashboard error at step:', step, error)
    return NextResponse.json(
      { error: 'Error al cargar el dashboard', ...(process.env.NODE_ENV !== 'production' ? { step, details: (error as any)?.message } : {}) },
      { status: 500 }
    )
  }
}

