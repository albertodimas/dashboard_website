import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar cliente por email
    const customer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase()
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const isValidPassword = customer.password 
      ? await bcrypt.compare(password, customer.password)
      : false

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        customerId: customer.id,
        email: customer.email,
        name: customer.name
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
        phone: customer.phone
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