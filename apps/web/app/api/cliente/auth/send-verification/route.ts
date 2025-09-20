import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { checkRateLimit, setCode } from '@/lib/verification-redis'
import { sendEmail, getVerificationEmailTemplate } from '@/lib/email'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(1).optional(),
      password: z.string().min(8).optional(),
      phone: z.string().optional(),
    })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Petición inválida', details: parsed.error.flatten() }, { status: 400 })
    }
    const { email, name, password, phone } = parsed.data

    // Rate limit by IP (5 requests / 10 minutes)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'cliente:send-verification', 5, 60 * 10)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiadas solicitudes', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 600) } }
      )
    }

    // Si ya existe con contraseña, permitimos OTP de login (sin datos de registro)
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: email.toLowerCase(), password: { not: null } }
    })

    // Per-email rate limit (max 3 active sends within TTL)
    const rl = await checkRateLimit(email)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes. Intenta de nuevo en ${rl.minutesLeft} minutos` },
        { status: 429 }
      )
    }

    // Generate and store code in Redis (15m TTL by default)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    // Attach registration data alongside code solo si NO existe el usuario
    if (existingCustomer) {
      await setCode(email, code)
    } else {
      await setCode(email, code, undefined, { name, password, phone })
    }

    // Send email via centralized sender
    const tpl = getVerificationEmailTemplate(code, 'verification')
    const sendRes = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text })
    if (!sendRes.success) {
      return NextResponse.json(
        { error: 'No se pudo enviar el email de verificación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Código de verificación enviado'
    })

  } catch (error) {
    logger.error('Send verification error:', error)
    return NextResponse.json(
      { error: 'Error al enviar código de verificación' },
      { status: 500 }
    )
  }
}

// In-memory cleanup removed – using Redis TTL
