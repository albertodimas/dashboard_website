import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const schema = z.object({ business: z.string().min(1) })
    const sp = Object.fromEntries(new URL(request.url).searchParams)
    const parsed = schema.safeParse(sp)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 })
    }
    const businessSlug = parsed.data.business

    // Rate limit by IP: 60 queries / 5 minutes
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'public:packages:list', 60, 60 * 5)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 300) } }
      )
    }

    const business = await prisma.business.findFirst({
      where: { 
        OR: [
          { slug: businessSlug },
          { customSlug: businessSlug }
        ]
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const packages = await prisma.package.findMany({
      where: { 
        businessId: business.id,
        isActive: true
      },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    return NextResponse.json(packages)
  } catch (error) {
    logger.error('Error fetching packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}
