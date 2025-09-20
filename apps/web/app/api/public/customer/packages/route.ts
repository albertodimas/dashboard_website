import { NextRequest, NextResponse } from 'next/server'
import { prisma, PurchaseStatus } from '@dashboard/db'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const schema = z.object({ email: z.string().email(), businessId: z.string().uuid() })
    const sp = Object.fromEntries(new URL(request.url).searchParams)
    const parsed = schema.safeParse(sp)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 })
    }
    const { email, businessId } = parsed.data

    // Rate limit by IP: 60 queries / 10 minutes
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'public:customer:packages', 60, 60 * 10)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 600) } }
      )
    }

    // Find customer by email AND businessId to ensure tenant isolation
    const customer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase(),
        businesses: {
          some: {
            businessId,
            isActive: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ 
        success: true, 
        packages: [] 
      })
    }

    // Get active package purchases for this customer and business
    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId: customer.id,
        businessId: businessId,
        status: PurchaseStatus.ACTIVE,
        remainingSessions: { gt: 0 },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } }
        ]
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
        }
      },
      orderBy: {
        remainingSessions: 'desc'
      }
    })

    return NextResponse.json({ 
      success: true, 
      packages,
      customer: {
        name: customer.name,
        phone: customer.phone
      }
    })

  } catch (error) {
    logger.error('Error fetching customer packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer packages' },
      { status: 500 }
    )
  }
}
