import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { checkRateLimit, setCode } from '@/lib/verification-redis'
import { sendEmail, getVerificationEmailTemplate, generateVerificationCode } from '@/lib/email'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({ email: z.string().email() })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Peticion invalida', details: parsed.error.flatten() }, { status: 400 })
    }
    const { email } = parsed.data

    // Rate limit by IP (5 attempts / 10 minutes)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'cliente:forgot-password', 5, 60 * 10)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiados intentos. Intenta mas tarde', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 600) } }
      )
    }

    // Find customer (case-insensitive)
    const customer = await prisma.customer.findFirst({ where: { email: email.toLowerCase() } })

    // Always return success even if not found, to avoid email enumeration
    if (!customer) {
      return NextResponse.json({ success: true, message: 'Si el email existe, recibiras un codigo de verificacion' })
    }

    // Per-email rate limit (max 3 within TTL)
    const rl = await checkRateLimit(customer.email)
    if (!rl.allowed) {
      return NextResponse.json({ success: true, message: 'Si el email existe, recibiras un codigo de verificacion' })
    }

    // Generate and store code in Redis
    const code = generateVerificationCode()
    await setCode(customer.email, code)

    // Send email
    const tpl = getVerificationEmailTemplate(code, 'reset')
    try {
      await sendEmail({
        to: customer.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        from: `"Nexodash" <${process.env.RESEND_FROM_EMAIL || 'noreply@nexodash.com'}>`
      })
    } catch (err) {
      // Do not reveal failures; log server-side only
      logger.error('Forgot password email send failed:', err)
    }

    return NextResponse.json({ success: true, message: 'Si el email existe, recibiras un codigo de verificacion' })
  } catch (error) {
    logger.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Error al procesar solicitud' }, { status: 500 })
  }
}

export const runtime = 'nodejs'

