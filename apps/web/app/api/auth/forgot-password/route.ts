import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { sendEmail, getVerificationEmailTemplate, generateVerificationCode } from '@/lib/email'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { checkRateLimit, setCode } from '@/lib/verification-redis'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({
      email: z.string().email(),
      userType: z.enum(['user', 'customer', 'cliente']).optional().default('user'),
    })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { email, userType } = parsed.data

    // Rate limit by IP (5 attempts / 10 minutes)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, `auth:forgot-password:${userType}`, 5, 60 * 10)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many attempts', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 600) } }
      )
    }

    // Look up account
    let targetEmail: string | null = null
    if (userType === 'customer' || userType === 'cliente') {
      const customer = await prisma.customer.findFirst({ where: { email: email.toLowerCase() } })
      targetEmail = customer?.email?.toLowerCase() || null
    } else {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      })
      targetEmail = user?.email?.toLowerCase() || null
    }

    // Always return success to avoid enumeration
    if (!targetEmail) {
      return NextResponse.json({ success: true, message: 'If the email exists, a code will be sent' })
    }

    // Per-email send rate limit (3 within TTL window)
    const rl = await checkRateLimit(targetEmail)
    if (!rl.allowed) {
      return NextResponse.json({ success: true, message: 'If the email exists, a code will be sent' })
    }

    // Generate and store code in Redis (15m TTL by default)
    const code = generateVerificationCode()
    await setCode(targetEmail, code)

    // Send email via centralized sender
    const tpl = getVerificationEmailTemplate(code, 'reset')
    try {
      await sendEmail({
        to: targetEmail,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        from: `"Dashboard" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@localhost'}>`
      })
    } catch (err) {
      // Log only; do not reveal failures to caller
      logger.error('System forgot-password email send failed:', err)
    }

    return NextResponse.json({ success: true, message: 'If the email exists, a code will be sent' })
  } catch (error) {
    logger.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

export const runtime = 'nodejs'

