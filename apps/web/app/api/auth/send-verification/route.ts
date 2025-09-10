import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { sendEmail } from '@/lib/email'
import { checkRateLimit, setCode } from '@/lib/verification-redis'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({ email: z.string().email() })
    const { email } = schema.parse(await request.json())

    // Rate limit by IP (5 codes / 15 minutes)
    const ip = getClientIP(request)
    const ipRate = await limitByIP(ip, 'auth:send-code:system', 5, 60 * 15)
    if (!ipRate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many attempts', retryAfter: ipRate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(ipRate.retryAfterSec || 900) } }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Check rate limiting (Redis)
    const rateLimit = await checkRateLimit(email)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${rateLimit.minutesLeft} minutes` },
        { status: 429 }
      )
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Log without exposing sensitive data
    if (process.env.NODE_ENV === 'development') {
      console.log('[VERIFICATION] Code generated successfully')
    }

    // Store code in Redis with TTL
    await setCode(email, code)
    
    // Silent dev log
    if (process.env.NODE_ENV === 'development') {
      console.log('[VERIFICATION] Code stored (Redis)')
    }

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify your email - Dashboard',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify your email address</h2>
            <p>Thank you for registering with Dashboard. Please use the following verification code to complete your registration:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4F46E5; letter-spacing: 5px; margin: 0;">${code}</h1>
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message from Dashboard. Please do not reply to this email.
            </p>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email'
    })
  } catch (error) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}

// Export verification functions for use in registration
// Deprecated exports removed in favor of Redis-backed module
