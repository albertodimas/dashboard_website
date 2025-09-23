import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { sendEmail, getVerificationEmailTemplate, generateVerificationCode } from '@/lib/email'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { checkRateLimit, setCode } from '@/lib/verification-redis'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (3 requests / 5 minutes)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'cliente:resend-verification', 3, 60 * 5)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiadas solicitudes de verificacion', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 300) } }
      )
    }

    // Obtener el customerId de la cookie temporal
    const customerId = request.cookies.get('verification-pending')?.value
    if (!customerId) {
      return NextResponse.json({ error: 'No hay verificacion pendiente' }, { status: 401 })
    }

    // Buscar el cliente
    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    if (customer.emailVerified) {
      return NextResponse.json({ error: 'El email ya esta verificado' }, { status: 400 })
    }

    // Per-email rate limit (max 3 within TTL)
    const rl = await checkRateLimit(customer.email)
    if (!rl.allowed) {
      return NextResponse.json({ error: `Demasiadas solicitudes. Intenta de nuevo en ${rl.minutesLeft} minutos` }, { status: 429 })
    }

    // Generate and store code (Redis)
    const verificationCode = generateVerificationCode()
    await setCode(customer.email, verificationCode)

    // Send email
    const emailTemplate = getVerificationEmailTemplate(verificationCode, 'verification')
    await sendEmail({ to: customer.email, subject: emailTemplate.subject, html: emailTemplate.html, text: emailTemplate.text })

    return NextResponse.json({ success: true, message: 'Codigo de verificacion reenviado' })
  } catch (error) {
    logger.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Error al reenviar codigo' }, { status: 500 })
  }
}

