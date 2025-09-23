import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { getAuthFromCookie } from '@/lib/jwt-auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get auth data from cookie using the same JWT library
    const session = await getAuthFromCookie()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user with language preference from database
  const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        avatar: true,
        phone: true,
        language: true,
        tenant: {
          select: {
            id: true,
            subdomain: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        avatar: user.avatar,
        phone: user.phone,
        language: user.language,
        tenantId: user.tenant.id,
        subdomain: user.tenant.subdomain || 'dashboard',
        role: session.role,
      },
    })
  } catch (error) {
    logger.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthFromCookie()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { language } = body

    // Update user language preference
    if (language && ['en', 'es'].includes(language)) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { language }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
