import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutos

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Obtener IP y User Agent para tracking
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Verificar intentos de login recientes
    const recentAttempts = await prisma.loginAttempt.count({
      where: {
        email: email.toLowerCase(),
        success: false,
        attemptedAt: {
          gte: new Date(Date.now() - LOCKOUT_DURATION)
        }
      }
    })

    // Si hay 5 o más intentos fallidos en los últimos 15 minutos, bloquear
    if (recentAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lastAttempt = await prisma.loginAttempt.findFirst({
        where: {
          email: email.toLowerCase(),
          success: false
        },
        orderBy: { attemptedAt: 'desc' }
      })

      const minutesRemaining = Math.ceil(
        (LOCKOUT_DURATION - (Date.now() - (lastAttempt?.attemptedAt?.getTime() || 0))) / 60000
      )

      return NextResponse.json(
        { 
          error: `Cuenta bloqueada temporalmente por seguridad. Intenta de nuevo en ${minutesRemaining} minutos.`,
          locked: true,
          minutesRemaining
        },
        { status: 429 }
      )
    }

    // Buscar cliente por email
    const customer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase()
      }
    })

    if (!customer) {
      // Registrar intento fallido
      await prisma.loginAttempt.create({
        data: {
          email: email.toLowerCase(),
          ipAddress,
          userAgent,
          success: false,
          customerId: null
        }
      })

      const attemptsLeft = MAX_LOGIN_ATTEMPTS - recentAttempts - 1
      
      return NextResponse.json(
        { 
          error: 'Credenciales inválidas',
          attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0,
          warning: attemptsLeft <= 2 && attemptsLeft > 0 ? 
            `Te quedan ${attemptsLeft} intento${attemptsLeft === 1 ? '' : 's'} antes de que tu cuenta sea bloqueada temporalmente.` : 
            undefined
        },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const isValidPassword = customer.password 
      ? await bcrypt.compare(password, customer.password)
      : false

    if (!isValidPassword) {
      // Registrar intento fallido
      await prisma.loginAttempt.create({
        data: {
          email: email.toLowerCase(),
          ipAddress,
          userAgent,
          success: false,
          customerId: customer.id
        }
      })

      const attemptsLeft = MAX_LOGIN_ATTEMPTS - recentAttempts - 1
      
      return NextResponse.json(
        { 
          error: 'Credenciales inválidas',
          attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0,
          warning: attemptsLeft <= 2 && attemptsLeft > 0 ? 
            `Te quedan ${attemptsLeft} intento${attemptsLeft === 1 ? '' : 's'} antes de que tu cuenta sea bloqueada temporalmente.` : 
            undefined
        },
        { status: 401 }
      )
    }

    // Login exitoso - registrar intento exitoso
    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        ipAddress,
        userAgent,
        success: true,
        customerId: customer.id
      }
    })

    // Limpiar intentos fallidos antiguos (opcional)
    await prisma.loginAttempt.deleteMany({
      where: {
        customerId: customer.id,
        success: false,
        attemptedAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Más de 24 horas
        }
      }
    })

    // Generar token JWT
    const token = jwt.sign(
      { 
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
        emailVerified: customer.emailVerified
      },
      JWT_SECRET,
      { expiresIn: '7d' }
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

    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        emailVerified: customer.emailVerified
      },
      packages,
      appointments
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}