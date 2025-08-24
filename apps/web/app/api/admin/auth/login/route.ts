import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@dashboard/db'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

// For now, we'll use a simple admin check
const ADMIN_EMAILS = ['admin@dashboard.com']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Check if email is in admin list
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Find user in database
    const user = await prisma.user.findFirst({
      where: { 
        email,
        isActive: true
      },
      include: { tenant: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash)
    
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate session token
    const sessionToken = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create session in database (without isAdmin field for now)
    await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        expires,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        userAgent: request.headers.get('user-agent') || ''
      }
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Set session cookie
    cookies().set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'admin'
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}