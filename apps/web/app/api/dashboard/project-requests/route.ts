import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const business = await getCurrentBusiness()
    if (!business) return createAuthResponse('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const requests = await prisma.projectRequest.findMany({
      where: { businessId: business.id, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ requests })
  } catch (e) {
    logger.error('Error fetching project requests:', e)
    return createAuthResponse('Failed to fetch project requests', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const business = await getCurrentBusiness()
    if (!business) return createAuthResponse('Unauthorized', 401)
    const body = await request.json()
    const { id, status } = body || {}
    if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })

    const allowed = ['NEW', 'CONTACTED', 'SCHEDULED', 'CLOSED']
    if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

    const updated = await prisma.projectRequest.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({ success: true, request: updated })
  } catch (e) {
    logger.error('Error updating project request:', e)
    return createAuthResponse('Failed to update project request', 500)
  }
}

