import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Import the verification codes map (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: Date; data: any }>()

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email y código son requeridos' },
        { status: 400 }
      )
    }

    // Get stored verification data
    const storedData = verificationCodes.get(email.toLowerCase())
    
    if (!storedData) {
      return NextResponse.json(
        { error: 'Código de verificación no encontrado o expirado' },
        { status: 400 }
      )
    }

    // Check if code is expired
    if (storedData.expires < new Date()) {
      verificationCodes.delete(email.toLowerCase())
      return NextResponse.json(
        { error: 'Código de verificación expirado' },
        { status: 400 }
      )
    }

    // Verify code
    if (storedData.code !== code) {
      return NextResponse.json(
        { error: 'Código de verificación incorrecto' },
        { status: 400 }
      )
    }

    // Code is valid, create or update customer
    const { name, password, phone } = storedData.data
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if customer exists
    let customer = await prisma.customer.findFirst({
      where: { email: email.toLowerCase() }
    })

    if (customer) {
      // Update existing customer
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          password: hashedPassword,
          name: name || customer.name,
          phone: phone || customer.phone,
          emailVerified: true
        }
      })
    } else {
      // Create new customer
      const defaultTenant = await prisma.tenant.findFirst()
      
      if (!defaultTenant) {
        return NextResponse.json(
          { error: 'Error de configuración del sistema' },
          { status: 500 }
        )
      }

      customer = await prisma.customer.create({
        data: {
          tenantId: defaultTenant.id,
          email: email.toLowerCase(),
          name,
          phone,
          password: hashedPassword,
          emailVerified: true,
          source: 'PORTAL'
        }
      })
    }

    // Clear verification code
    verificationCodes.delete(email.toLowerCase())

    // Generate JWT token
    const token = jwt.sign(
      { 
        customerId: customer.id,
        email: customer.email,
        name: customer.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Get customer's packages and appointments
    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId: customer.id,
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
                slug: true
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
      }
    })

    const appointments = await prisma.appointment.findMany({
      where: {
        customerId: customer.id,
        startTime: { gte: new Date() }
      },
      include: {
        service: {
          select: {
            name: true,
            duration: true
          }
        },
        business: {
          select: {
            name: true
          }
        },
        staff: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 10
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
      appointments,
      message: 'Email verificado exitosamente'
    })

  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Error al verificar código' },
      { status: 500 }
    )
  }
}