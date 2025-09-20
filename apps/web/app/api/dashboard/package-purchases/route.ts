import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@dashboard/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { tenant: true }
    })

    if (!user?.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      )
    }

    // Get the business for this tenant
    const business = await prisma.business.findFirst({
      where: { tenantId: user.tenantId }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'No business found' },
        { status: 404 }
      )
    }

    // Get all package purchases for this business
    const purchases = await prisma.packagePurchase.findMany({
      where: { businessId: business.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        package: {
          select: {
            id: true,
            name: true,
            price: true,
            sessionCount: true
          }
        },
        sessionUsages: {
          select: {
            id: true,
            appointmentId: true,
            usedAt: true,
            sessionNumber: true
          }
        }
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    })

    return NextResponse.json(purchases)

  } catch (error) {
    logger.error('Error fetching package purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch package purchases' },
      { status: 500 }
    )
  }
}