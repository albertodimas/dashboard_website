import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'

// Unify client token secret with middleware/lib behavior
const CLIENT_JWT_SECRET = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET
const REFRESH_SECRET = process.env.REFRESH_SECRET
if (!CLIENT_JWT_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets (CLIENT_JWT_SECRET or JWT_SECRET, and REFRESH_SECRET) are required')
}
const CLIENT_JWT_SECRET_BYTES = new TextEncoder().encode(CLIENT_JWT_SECRET)
const REFRESH_SECRET_BYTES = new TextEncoder().encode(REFRESH_SECRET)

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
      businessSlug: z.string().min(1).optional(),
    })
    const { email, password, businessSlug } = schema.parse(await request.json())

    // Rate limit by IP (10 attempts / 5 minutes)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'auth:login:client', 10, 60 * 5)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiados intentos. Intenta más tarde', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 300) } }
      )
    }
    
    console.log('[Cliente Login] Attempt')

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Obtener información del request para el tracking
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Verificar intentos fallidos recientes (rate limiting)
    const recentFailedAttempts = await prisma.loginAttempt.count({
      where: {
        email: email.toLowerCase(),
        success: false,
        attemptedAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Últimos 15 minutos
        }
      }
    })

    if (recentFailedAttempts >= 5) {
      console.log('[Cliente Login] Rate limit excedido')
      return NextResponse.json(
        { 
          error: 'Demasiados intentos fallidos. Por favor, espera 15 minutos antes de intentar nuevamente.',
          retryAfter: 15 * 60 // segundos
        },
        { status: 429 }
      )
    }

    // Si se proporciona businessSlug, buscar el tenant correspondiente
    let tenantId: string | undefined
    if (businessSlug) {
      const business = await prisma.business.findFirst({
        where: {
          OR: [
            { slug: businessSlug },
            { customSlug: businessSlug }
          ]
        }
      })
      if (business) {
        tenantId = business.tenantId
        console.log('[Cliente Login] Business context resolved')
      }
    }

    // Buscar cliente por email. Preferir tenant si se resolvió, pero permitir global
    let customer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(tenantId ? { tenantId } : {})
      }
    })
    // Si no aparece en este tenant, permitir el registro global (sin clonar)
    if (!customer) {
      const anyCustomer = await prisma.customer.findFirst({ where: { email: email.toLowerCase() } })
      if (anyCustomer) {
        customer = anyCustomer
      }
    }
    
    console.log('[Cliente Login] Customer lookup complete')
    
    // Si no encontramos el cliente en este tenant pero existe en otro tenant con la misma contraseña,
    // podemos verificar si es el mismo cliente
    // Ya no clonamos clientes entre tenants. Siempre usamos el registro global por email
    let customerInOtherTenant: typeof customer | null = null

    // Elegir el mejor candidato por email y contraseña si existen duplicados
    const emailCandidates = await prisma.customer.findMany({
      where: { email: email.toLowerCase() },
      orderBy: { createdAt: 'desc' }
    })
    if (emailCandidates.length > 1) {
      // Filtrar por contraseña válida
      const matching: typeof emailCandidates = [] as any
      for (const c of emailCandidates) {
        if (c.password && (await bcrypt.compare(password, c.password))) {
          matching.push(c)
        }
      }
      const pool = matching.length > 0 ? matching : emailCandidates
      const score = (c: any) =>
        (c.name && c.name.trim() ? 1 : 0) +
        (c.lastName && String(c.lastName).trim() ? 1 : 0) +
        (c.phone && String(c.phone).trim() ? 1 : 0) +
        (tenantId && c.tenantId === tenantId ? 2 : 0)
      const best = pool.reduce((a, b) => (score(b) > score(a) ? b : a), pool[0])
      if (!customer || customer.id !== best.id) {
        customer = best as any
        console.log('[Cliente Login] Seleccionado mejor candidato por email/contraseña:', customer.id)
      }
    }

    // Si existe el cliente en este tenant pero le faltan datos básicos,
    // intentar completarlos con datos de otro tenant (si disponibles)
    if (customer) {
      // Cargar registro de otro tenant si no lo tenemos aún
      if (!customerInOtherTenant) {
        customerInOtherTenant = await prisma.customer.findFirst({
          where: {
            email: email.toLowerCase(),
            NOT: { id: customer.id }
          }
        })
      }

      const needsName = !customer.name || customer.name.trim() === ''
      const needsLastName = (customer.lastName ?? '').toString().trim() === '' && (customerInOtherTenant?.lastName ?? '').toString().trim() !== ''
      const needsPhone = (!customer.phone || customer.phone.trim() === '') && (customerInOtherTenant?.phone ?? '').toString().trim() !== ''
      const needsAddressLike = (!customer.address && customerInOtherTenant?.address) || (!customer.city && customerInOtherTenant?.city) || (!customer.state && customerInOtherTenant?.state) || (!customer.postalCode && customerInOtherTenant?.postalCode)

      if (customerInOtherTenant && (needsName || needsLastName || needsPhone || needsAddressLike)) {
        const updated = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            ...(needsName && customerInOtherTenant.name ? { name: customerInOtherTenant.name } : {}),
            ...(needsLastName ? { lastName: customerInOtherTenant.lastName } : {}),
            ...(needsPhone ? { phone: customerInOtherTenant.phone } : {}),
            ...(customer.address ? {} : { address: customerInOtherTenant.address || null }),
            ...(customer.city ? {} : { city: customerInOtherTenant.city || null }),
            ...(customer.state ? {} : { state: customerInOtherTenant.state || null }),
            ...(customer.postalCode ? {} : { postalCode: customerInOtherTenant.postalCode || null })
          }
        })
        customer = updated
        console.log('[Cliente Login] Perfil completado con datos de otro tenant')
      }
    }

    // Si no se resolvió tenantId, elegir el registro más "completo" por email
    if (!tenantId) {
      const candidates = await prisma.customer.findMany({
        where: { email: email.toLowerCase() },
        orderBy: { createdAt: 'desc' }
      })
      if (candidates.length > 0) {
        const score = (c: any) =>
          (c.name && c.name.trim() ? 1 : 0) +
          (c.lastName && String(c.lastName).trim() ? 1 : 0) +
          (c.phone && String(c.phone).trim() ? 1 : 0)
        const best = candidates.reduce((a, b) => (score(b) > score(a) ? b : a), candidates[0])
        if (!customer || best.id !== customer.id) {
          customer = best
          console.log('[Cliente Login] Seleccionado registro más completo por email (sin tenant)')
        }
      }
    }

    if (!customer) {
      // Registrar intento fallido
      await prisma.loginAttempt.create({
        data: {
          email: email.toLowerCase(),
          ipAddress,
          userAgent,
          success: false
        }
      })
      
      return NextResponse.json(
        { 
          error: 'Credenciales inválidas'
        },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const isValidPassword = customer.password 
      ? await bcrypt.compare(password, customer.password)
      : false

    if (!isValidPassword) {
      // Registrar intento fallido con customerId
      await prisma.loginAttempt.create({
        data: {
          email: email.toLowerCase(),
          ipAddress,
          userAgent,
          success: false,
          customerId: customer.id
        }
      })
      
      return NextResponse.json(
        { 
          error: 'Credenciales inválidas'
        },
        { status: 401 }
      )
    }

    // Registrar intento exitoso
    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        ipAddress,
        userAgent,
        success: true,
        customerId: customer.id
      }
    })

    // Si se está logueando desde una página de negocio, guardar referencia y crear relación
    let referringBusinessId: string | undefined
    if (businessSlug) {
      const business = await prisma.business.findFirst({
        where: {
          OR: [
            { slug: businessSlug },
            { customSlug: businessSlug }
          ]
        }
      })
      
      if (business) {
        referringBusinessId = business.id
        console.log('[Cliente Login] Accediendo desde el negocio:', business.name)
        
        // Verificar si ya existe la relación con este negocio
        const existingRelation = await prisma.businessCustomer.findUnique({
          where: {
            businessId_customerId: {
              businessId: business.id,
              customerId: customer.id
            }
          }
        })
        
        if (!existingRelation) {
          // Crear la relación cliente-negocio (auto-registro)
          await prisma.businessCustomer.create({
            data: {
              businessId: business.id,
              customerId: customer.id,
              lastVisit: new Date(),
              totalVisits: 1
            }
          })
          console.log('[Cliente Login] Auto-registro: Cliente registrado en negocio', business.name)
        } else {
          // Actualizar última visita y contador
          await prisma.businessCustomer.update({
            where: {
              businessId_customerId: {
                businessId: business.id,
                customerId: customer.id
              }
            },
            data: {
              lastVisit: new Date(),
              totalVisits: { increment: 1 },
              isActive: true // Reactivar si estaba desactivado
            }
          })
        }
      }
    }

    // Generar tokens JWT (access y refresh) con jose
    const token = await new SignJWT({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      emailVerified: customer.emailVerified
    } as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(CLIENT_JWT_SECRET_BYTES)

    const refreshToken = await new SignJWT({
      customerId: customer.id,
      type: 'refresh'
    } as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(REFRESH_SECRET_BYTES)

    // Obtener paquetes activos del cliente
    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId: customer.id,
        status: 'ACTIVE',
        remainingSessions: { gt: 0 },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } }
        ]
      },
      include: {
        package: {
          include: {
            business: true,
            services: {
              include: {
                service: true
              }
            }
          }
        }
      }
    })

    // Obtener citas próximas
    const appointments = await prisma.appointment.findMany({
      where: {
        customerId: customer.id,
        startTime: { gte: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      include: {
        service: true,
        business: true,
        staff: true
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 5
    })

    // Crear respuesta con cookie HTTP-only
    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        emailVerified: customer.emailVerified
      },
      packages,
      appointments,
      referringBusinessId // ID del negocio desde donde se logueó
    })

    // Establecer cookies HTTP-only seguras
    response.cookies.set('client-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hora
      path: '/'
    })

    response.cookies.set('client-refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Más estricto para refresh token
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/'
    })

    // Si hay un negocio de referencia, guardarlo en una cookie
    if (referringBusinessId) {
      response.cookies.set('referring-business', referringBusinessId, {
        httpOnly: false, // No httpOnly para que el cliente pueda leerlo
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 horas
        path: '/'
      })
    }

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
