import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { email, password, businessSlug } = await request.json()
    
    console.log('[Cliente Login] Email:', email, 'BusinessSlug:', businessSlug)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
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
        console.log('[Cliente Login] Business found:', business.name, 'TenantID:', tenantId)
      }
    }

    // Buscar cliente por email y opcionalmente por tenant
    const customer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(tenantId ? { tenantId } : {})
      }
    })
    
    console.log('[Cliente Login] Customer found:', customer?.id, 'TenantID:', customer?.tenantId)

    if (!customer) {
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
      return NextResponse.json(
        { 
          error: 'Credenciales inválidas'
        },
        { status: 401 }
      )
    }

    // Si se está logueando desde una página de negocio, guardar referencia
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
      }
    }

    // Generar tokens JWT (access y refresh)
    const token = jwt.sign(
      { 
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
        emailVerified: customer.emailVerified
      },
      JWT_SECRET,
      { expiresIn: '1h' } // Token de acceso de corta duración
    )

    const refreshToken = jwt.sign(
      { 
        customerId: customer.id,
        type: 'refresh'
      },
      REFRESH_SECRET,
      { expiresIn: '30d' } // Refresh token de larga duración
    )

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