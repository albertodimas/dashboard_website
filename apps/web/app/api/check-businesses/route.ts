import { NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        customSlug: true,
        isActive: true
      }
    })
    
    return NextResponse.json({ businesses })
  } catch (error) {
    logger.error('Error fetching businesses:', error)
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
  }
}