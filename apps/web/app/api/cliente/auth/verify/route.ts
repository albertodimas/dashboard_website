import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { z } from 'zod'
import { verifyCode as verifyCodeRedis, clearCode as clearCodeRedis } from '@/lib/verification-redis'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({ code: z.string().min(4).max(12) })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Codigo requerido' }, { status: 400 })
    }
    const { code } = parsed.data

    // Get customerId from cookie
    const customerId = request.cookies.get('verification-pending')?.value
    if (!customerId) {
      return NextResponse.json({ error: 'No hay verificacion pendiente' }, { status: 401 })
    }

    // Load customer to get email
    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Verify code in Redis scoped by email
    const valid = await verifyCodeRedis(customer.email, code)
    if (!valid) {
      return NextResponse.json({ error: 'Codigo invalido o expirado' }, { status: 400 })
    }

    // Mark as verified
    await prisma.customer.update({ where: { id: customerId }, data: { emailVerified: true } })

    // Clear code and cookie
    await clearCodeRedis(customer.email)
    const response = NextResponse.json({ success: true, message: 'Email verificado exitosamente. Por favor inicia sesion.' })
    response.cookies.delete('verification-pending')
    return response
  } catch (error) {
    logger.error('Verification error:', error)
    return NextResponse.json({ error: 'Error al verificar codigo' }, { status: 500 })
  }
}

