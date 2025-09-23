import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@nexodash/db'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Config de seguridad básica para el endpoint
const WINDOW_MINUTES = 15
const MAX_ATTEMPTS = 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const emailRaw: string = (body?.email || '').toString()
    const password: string = (body?.password || '').toString()

    const email = emailRaw.toLowerCase().trim()
    if (!email || !password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Rate limit por email (últimos WINDOW_MINUTES)
    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)
    const recentFailures = await prisma.loginAttempt.count({
      where: { email, success: false, attemptedAt: { gte: since } }
    })
    if (recentFailures >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429 }
      )
    }

    // Buscar usuario admin activo (sin listas hardcodeadas)
    const user = await prisma.user.findFirst({
      where: { email, isActive: true, isAdmin: true },
      include: { tenant: true }
    })
    if (!user) {
      await prisma.loginAttempt.create({ data: { email, success: false } })
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      await prisma.loginAttempt.create({ data: { email, success: false } })
      const remaining = Math.max(0, MAX_ATTEMPTS - (recentFailures + 1))
      return NextResponse.json(
        { error: 'Invalid credentials', warning: remaining === 0 ? 'Account temporarily locked' : `Remaining attempts: ${remaining}` },
        { status: 401 }
      )
    }

    // Registro de intento exitoso
    await prisma.loginAttempt.create({ data: { email, success: true } })

    // Generar sesión (24h)
    const sessionToken = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        expires,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        userAgent: request.headers.get('user-agent') || ''
      }
    })

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    // Cookie de sesión segura
    cookies().set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: 'admin' }
    })
  } catch (error) {
    logger.error('Admin login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
