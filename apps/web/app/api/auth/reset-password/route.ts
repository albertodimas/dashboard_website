import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import bcrypt from 'bcryptjs'
import { generateClientToken } from '@/lib/client-auth'
import { verifyCode as verifyCodeRedis, clearCode as clearCodeRedis } from '@/lib/verification-redis'
import { setAuthCookie } from '@/lib/jwt-auth'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({
      email: z.string().email(),
      code: z.string().regex(/^\d{6}$/),
      newPassword: z.string().min(8),
      userType: z.union([z.literal('user'), z.literal('customer'), z.literal('cliente')]).optional().default('user')
    })
    const { email, code, newPassword, userType } = schema.parse(await request.json())

    // Rate limit by IP (10 resets / 15 minutes)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'auth:reset:system', 10, 60 * 15)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many attempts', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 900) } }
      )
    }

    logger.info(`Processing reset password for ${userType}`)

    // Buscar usuario o cliente según el tipo
    let user: any = null
    let isCustomer = false

    if (userType === 'customer' || userType === 'cliente') {
      // Buscar cliente
      user = await prisma.customer.findFirst({
        where: {
          email: email.toLowerCase()
        }
      })
      isCustomer = true
    } else {
      // Buscar usuario del sistema
      user = await prisma.user.findFirst({
        where: { 
          email: {
            equals: email,
            mode: 'insensitive'
          }
        },
        include: {
          tenant: true
        }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Código inválido o expirado' },
        { status: 400 }
      )
    }

    // Verificar el código para clientes
    if (isCustomer) {
      const verificationCode = await prisma.verificationCode.findFirst({
        where: {
          customerId: user.id,
          code: code,
          type: 'PASSWORD_RESET',
          usedAt: null,
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (!verificationCode) {
        return NextResponse.json(
          { error: 'Código inválido o expirado' },
          { status: 400 }
        )
      }

      // Hashear la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      
      // Actualizar la contraseña del cliente y marcar código como usado
      const [updatedCustomer, _] = await prisma.$transaction([
        prisma.customer.update({
          where: { id: user.id },
          data: { 
            password: hashedPassword,
            emailVerified: true
          }
        }),
        prisma.verificationCode.update({
          where: { id: verificationCode.id },
          data: { usedAt: new Date() }
        })
      ])

      // Generar token para auto-login de cliente
      const token = await generateClientToken({
        customerId: updatedCustomer.id,
        email: updatedCustomer.email,
        name: updatedCustomer.name
      })

      logger.info('✅ Password reset successful for customer:', updatedCustomer.email)

      return NextResponse.json({
        success: true,
        token,
        customer: {
          id: updatedCustomer.id,
          email: updatedCustomer.email,
          name: updatedCustomer.name,
          emailVerified: true
        },
        message: 'Contraseña actualizada exitosamente'
      })
    } else {
      // Para usuarios del sistema, verificar el código de manera segura
      const ok = await verifyCodeRedis(email, code)
      
      if (!ok) {
        logger.error('❌ Invalid verification code for system user')
        return NextResponse.json(
          { error: 'Código de verificación inválido o expirado' },
          { status: 400 }
        )
      }
      
      // Limpiar el código usado
      await clearCodeRedis(email)
      
      // Hashear la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      
      // Actualizar la contraseña del usuario
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { 
          passwordHash: hashedPassword
        }
      })

      // Crear sesión JWT para usuario del sistema
      await setAuthCookie({
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name || '',
        tenantId: updatedUser.tenantId || undefined,
        subdomain: user.tenant?.subdomain || 'dashboard',
        role: 'OWNER'
      })

      logger.info('✅ Password reset successful for user:', updatedUser.email)

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          subdomain: user.tenant?.subdomain || 'dashboard',
          role: 'OWNER'
        },
        message: 'Contraseña actualizada exitosamente'
      })
    }

  } catch (error: any) {
    logger.error('Reset password error:', error)
    
    return NextResponse.json(
      { error: 'Error al restablecer contraseña' },
      { status: 500 }
    )
  }
}

// Asegurar ejecución en Node.js
export const runtime = 'nodejs'
