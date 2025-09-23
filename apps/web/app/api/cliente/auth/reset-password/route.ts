import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import bcrypt from 'bcryptjs'
import { generateClientToken } from '@/lib/client-auth'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { verifyCode as verifyCodeRedis, clearCode as clearCodeRedis } from '@/lib/verification-redis'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({
      email: z.string().email(),
      code: z.string().min(4).max(12),
      newPassword: z.string().min(8),
    })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Peticion invalida', details: parsed.error.flatten() }, { status: 400 })
    }
    const { email, code, newPassword } = parsed.data

    // Rate limit by IP (5 attempts / 10 minutes)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'cliente:reset-password', 5, 60 * 10)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiados intentos. Intenta mas tarde', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 600) } }
      )
    }

    // Find customer
    const customer = await prisma.customer.findFirst({ where: { email: email.toLowerCase() } })
    if (!customer) {
      return NextResponse.json({ error: 'Codigo invalido o expirado' }, { status: 400 })
    }

    // Validate code via Redis
    const valid = await verifyCodeRedis(email, code)
    if (!valid) {
      return NextResponse.json({ error: 'Codigo invalido o expirado' }, { status: 400 })
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: { password: hashedPassword, emailVerified: true }
    })

    // Clear code in Redis
    await clearCodeRedis(email)

    // Generate token for auto-login
    const token = await generateClientToken({
      customerId: updatedCustomer.id,
      email: updatedCustomer.email,
      name: updatedCustomer.name
    })

    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        emailVerified: true
      },
      message: 'Contrasena actualizada exitosamente'
    })
  } catch (error) {
    logger.error('Reset password error:', error)
    return NextResponse.json({ error: 'Error al restablecer contrasena' }, { status: 500 })
  }
}

