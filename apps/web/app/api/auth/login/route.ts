import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@dashboard/db'
import { setAuthCookie } from '@/lib/jwt-auth'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
      subdomain: z.string().min(1).optional(),
    })
    const { email, password /*, subdomain*/ } = schema.parse(await request.json())

    // Rate limit by IP (10 attempts / 5 minutes)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'auth:login:system', 10, 60 * 5)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many attempts', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 300) } }
      )
    }

    // Find user - for now without tenant filtering until we update frontend
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
    logger.error('Login error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
