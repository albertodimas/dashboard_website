import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@dashboard/db'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Decode session (simplified version)
    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

    // Get user with language preference from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
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
        language: user.language,
        tenantId: user.tenant.id,
        subdomain: user.tenant.subdomain || 'dashboard',
        role: session.role,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

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