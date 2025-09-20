import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@dashboard/db'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('customer_session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

    if (!session.customerId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    logger.info('[DEBUG] Customer Session:', {
      customerId: session.customerId,
      customerEmail: session.customerEmail,
      customerName: session.customerName
    })

    // Get all package purchases for this customer
    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId: session.customerId,
        status: {
          in: ['PENDING', 'ACTIVE', 'EXPIRED']
        }
      },
      include: {
        package: {
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        },
        business: {
          select: {
            name: true,
            slug: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get appointment history
    const appointments = await prisma.appointment.findMany({
      where: {
        customerId: session.customerId
      },
      include: {
        service: true,
        staff: {
          select: {
            name: true
          }
        },
        business: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 10 // Last 10 appointments
    })

    logger.info('[DEBUG] Packages found:', packages.length)
    logger.info('[DEBUG] Appointments found:', appointments.length)
    
    // Calculate stats
    const stats = {
      activePackages: packages.filter(p => p.status === 'ACTIVE').length,
      pendingPackages: packages.filter(p => p.status === 'PENDING').length,
      totalSessionsAvailable: packages
        .filter(p => p.status === 'ACTIVE')
        .reduce((acc, p) => acc + p.remainingSessions, 0),
      upcomingAppointments: appointments.filter(a => 
        new Date(a.startTime) > new Date() && a.status !== 'CANCELLED'
      ).length
    }

    logger.info('[DEBUG] Stats:', stats)

    return NextResponse.json({
      packages,
      appointments,
      stats,
      customer: {
        name: session.customerName,
        email: session.customerEmail
      }
    })

  } catch (error) {
    logger.error('Error fetching customer packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}
