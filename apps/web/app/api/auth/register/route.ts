import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@dashboard/db'
import { verifyCode, clearCode } from '@/lib/verification-redis'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

type RegisterTransactionResult = {
  tenant: { id: string }
  user: { id: string; email: string; name: string }
}

function isUniqueConstraintError(error: unknown): error is { code: string; meta?: { target?: string | string[] } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  )
}

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      confirmPassword: z.string().min(8),
      name: z.string().min(1),
      lastName: z.string().min(1).optional(),
      tenantName: z.string().optional(),
      subdomain: z.string().optional(),
      businessType: z.string().optional(),
      verificationCode: z.string().regex(/^\d{6}$/),
    }).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
    const { email, password, confirmPassword, name, lastName, tenantName, subdomain, businessType, verificationCode } = schema.parse(await request.json())

    // Rate limit by IP (5 registrations / hour)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'auth:register:system', 5, 60 * 60)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many attempts', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 3600) } }
      )
    }

    // Validate verification code
    // Log without exposing sensitive data
    if (process.env.NODE_ENV === 'development') {
      logger.info('[REGISTER] Verifying code for user')
    }
    const isValidCode = await verifyCode(email, verificationCode)
    if (process.env.NODE_ENV === 'development') {
      logger.info('[REGISTER] Code validation result:', isValidCode)
    }
    
    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Additional password validation
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*]/.test(password)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return NextResponse.json(
        { error: 'Password must contain uppercase, lowercase, number and special character' },
        { status: 400 }
      )
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Check availability pre-flight to avoid partial creates
    const [existingUser, existingTenant] = await Promise.all([
      prisma.user.findFirst({ where: { email } }),
      prisma.tenant.findFirst({ where: { subdomain: (subdomain || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')) } })
    ])

    if (existingUser) {
      return NextResponse.json({ error: 'Email is already registered', field: 'email' }, { status: 409 })
    }
    if (existingTenant) {
      return NextResponse.json({ error: 'Subdomain already in use', field: 'subdomain' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create tenant and user
    const tenantSubdomain = subdomain || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    
    logger.info('[REGISTER] Creating tenant with data:', {
      name: tenantName || name + "'s Business",
      subdomain: tenantSubdomain,
      email: email,
      settings: {}
    })
    
    const { tenant, user } = (await prisma.$transaction(async (tx: any) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName || name + "'s Business",
          subdomain: tenantSubdomain,
          email: email,
          settings: JSON.parse(JSON.stringify({})),
        },
      })
      // Try creating with lastName first; if client is outdated (Unknown argument), fallback without it
      try {
        const user = await tx.user.create({
          data: {
            email,
            name: lastName ? `${name} ${lastName}` : name,
            // On newer schema, this column exists
            lastName: lastName || null,
            passwordHash,
            tenantId: tenant.id,
            emailVerified: new Date(), // Mark as verified since they used the code
            isActive: true,
          },
        })
        return { tenant, user }
      } catch (e) {
        const msg = (e as any)?.message || ''
        const unknownLastName = typeof msg === 'string' && msg.includes('Unknown argument') && msg.includes('lastName')
        if (!unknownLastName) throw e
        if (process.env.NODE_ENV === 'development') {
          logger.warn('[REGISTER] Prisma client seems outdated (no lastName). Falling back without lastName.')
        }
        const user = await tx.user.create({
          data: {
            email,
            name: lastName ? `${name} ${lastName}` : name,
            // Fallback without lastName for older generated clients
            passwordHash,
            tenantId: tenant.id,
            emailVerified: new Date(),
            isActive: true,
          },
        })
        return { tenant, user }
      }
    })) as unknown as RegisterTransactionResult

    // Note: Business and Membership models will be created when those tables are added to the schema
    if (process.env.NODE_ENV === 'development') {
      logger.info('[REGISTER] Created tenant and user:', { tenantId: tenant.id, userId: user.id })
    }

    // Clear the verification code after successful registration (best-effort)
    try {
      await clearCode(email)
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('[REGISTER] Failed to clear verification code (non-fatal):', (e as any)?.message || e)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    // Log error with minimal PII
    logger.error('Registration error:', (error as any)?.message || error)
    if (isUniqueConstraintError(error)) {
      // Handle Prisma unique constraint violations robustly
      const rawTarget = (error as any)?.meta?.target
      let targetFields: string[] = []
      if (Array.isArray(rawTarget)) {
        targetFields = rawTarget as string[]
      } else if (typeof rawTarget === 'string') {
        targetFields = [rawTarget as string]
      }
      const targetStr = targetFields.join(',')

      const emailConflict = targetFields.includes('email') || targetStr.includes('email')
      const subdomainConflict = targetFields.includes('subdomain') || targetStr.includes('subdomain')

      if (emailConflict) {
        return NextResponse.json({ error: 'Email is already registered', field: 'email' }, { status: 409 })
      }
      if (subdomainConflict) {
        return NextResponse.json({ error: 'Subdomain already in use', field: 'subdomain' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Unique constraint violated' }, { status: 409 })
    }
    return NextResponse.json(
      {
        error: 'Failed to create account. Please try again.',
        ...(process.env.NODE_ENV !== 'production' ? { details: (error as any)?.message } : {}),
      },
      { status: 500 }
    )
  }
}
