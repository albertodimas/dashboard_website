import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// POST reassign gallery items from one category to another (gallery_items table)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const from = body.from as string | undefined
    const to = (body.to as string | undefined) || ''

    if (from === undefined) {
      return NextResponse.json({ error: 'From category is required' }, { status: 400 })
    }

    const business = await getCurrentBusiness()
    if (!business) return createAuthResponse('Business not found', 404)

    const result = await prisma.galleryItem.updateMany({
      where: { businessId: business.id, category: from },
      data: { category: to || null }
    })

    return NextResponse.json({ success: true, updated: result.count })
  } catch (error) {
    logger.error('Error reassigning gallery categories:', error)
    return NextResponse.json({ error: 'Failed to reassign gallery item categories' }, { status: 500 })
  }
}
