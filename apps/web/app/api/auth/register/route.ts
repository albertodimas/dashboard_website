import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@dashboard/db'
import { verifyCode, clearCode } from '@/lib/verification-redis'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      confirmPassword: z.string().min(8),
      name: z.string().min(1),
      tenantName: z.string().optional(),
      subdomain: z.string().optional(),
      businessType: z.string().optional(),
      verificationCode: z.string().regex(/^\d{6}$/),
    }).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
    const { email, password, confirmPassword, name, tenantName, subdomain, businessType, verificationCode } = schema.parse(await request.json())

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
      console.log('[REGISTER] Verifying code for user')
    }
    const isValidCode = await verifyCode(email, verificationCode)
    if (process.env.NODE_ENV === 'development') {
      console.log('[REGISTER] Code validation result:', isValidCode)
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

    // Check if email is already registered
    const existingUser = await prisma.user.findFirst({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create tenant and user
    const tenantSubdomain = subdomain || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    
    console.log('[REGISTER] Creating tenant with data:', {
      name: tenantName || name + "'s Business",
      subdomain: tenantSubdomain,
      email: email,
      settings: {}
    })
    
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName || name + "'s Business",
        subdomain: tenantSubdomain,
        email: email,
        settings: JSON.parse(JSON.stringify({})),
      },
    })

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        tenantId: tenant.id,
        emailVerified: new Date(), // Mark as verified since they used the code
        isActive: true,
      },
    })

    // Note: Business and Membership models will be created when those tables are added to the schema

    // Clear the verification code after successful registration
    await clearCode(email)

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
    console.error('Registration error:', error)
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      // Check for Prisma-specific errors
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Email or subdomain is already taken' },
          { status: 400 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
