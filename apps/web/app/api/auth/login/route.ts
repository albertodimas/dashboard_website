import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@dashboard/db'
import { setAuthCookie } from '@/lib/jwt-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user with proper tenant filtering
    const user = await prisma.user.findFirst({
      where: { email },
      include: { 
        tenant: true
      }
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

    // Determine user role
    let userRole = 'OWNER'
    if (user.isAdmin) {
      userRole = 'ADMIN'
    } else {
      // Check if user has membership in a business
      const membership = await prisma.membership.findFirst({
        where: { userId: user.id },
        select: { role: true }
      })
      if (membership) {
        userRole = membership.role
      }
    }

    // Create secure JWT session
    await setAuthCookie({
      userId: user.id,
      email: user.email,
      name: user.name || '',
      tenantId: user.tenantId || undefined,
      subdomain: user.tenant?.subdomain || 'dashboard',
      role: userRole,
      isAdmin: user.isAdmin || false
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subdomain: user.tenant?.subdomain || 'dashboard',
        role: userRole,
        isAdmin: user.isAdmin || false
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}