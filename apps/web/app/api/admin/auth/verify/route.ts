import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { cookies } from 'next/headers'

// For now, we'll use a simple admin check
const ADMIN_EMAILS = ['admin@dashboard.com']

export async function GET(request: NextRequest) {
  try {
    const sessionToken = cookies().get('admin-session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Find session in database
    const session = await prisma.session.findUnique({
      where: { 
        sessionToken
      },
      include: {
        user: {
          include: {
            tenant: true
          }
        }
      }
    })

    if (!session || session.expires < new Date()) {
      // Session expired or not found
      if (session) {
        await prisma.session.delete({
          where: { id: session.id }
        })
      }
      
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: 'admin'
      }
    })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 401 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = cookies().get('admin-session')?.value

    if (sessionToken) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { sessionToken }
      })
      
      // Clear cookie
      cookies().delete('admin-session')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}