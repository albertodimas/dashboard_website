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

    // Obtener paquetes activos
    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId: decoded.customerId,
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

    // Obtener citas (excluyendo las canceladas)
    const appointments = await prisma.appointment.findMany({
      where: {
        customerId: decoded.customerId,
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
            name: true,
            address: true,
            phone: true
          }
        },
        staff: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 20
    })

    // Obtener datos del cliente
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      customer,
      packages,
      appointments
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Error al cargar el dashboard' },
      { status: 500 }
    )
  }
}