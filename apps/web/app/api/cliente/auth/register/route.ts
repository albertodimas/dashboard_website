import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendEmail, getVerificationEmailTemplate, generateVerificationCode } from '@/lib/email'
import { setCode } from '@/lib/verification-redis'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
      businessSlug: z.string().optional(),
    })
    const { email, password, name, lastName, phone, businessSlug } = schema.parse(await request.json())

    // Resolver tenant desde businessSlug cuando esté disponible
    let tenantId: string | undefined
    if (businessSlug) {
      const biz = await prisma.business.findFirst({
        where: { OR: [{ slug: businessSlug }, { customSlug: businessSlug }] },
        select: { tenantId: true }
      })
      if (biz) tenantId = biz.tenantId
    }

    // Si no se pudo resolver, usar el primer tenant como fallback
    if (!tenantId) {
      const defaultTenant = await prisma.tenant.findFirst({ select: { id: true } })
      if (!defaultTenant) {
        return NextResponse.json(
          { error: 'Error de configuración del sistema' },
          { status: 500 }
        )
      }
      tenantId = defaultTenant.id
    }

    // Verificar si ya existe en CUALQUIER tenant (registro global por email)
    const existingAny = await prisma.customer.findFirst({
      where: { email: email.toLowerCase() }
    })

    if (existingAny) {
      // Si existe pero no tiene contraseña (importado), completar y verificar
      if (!existingAny.password) {
        const hashedPassword = await bcrypt.hash(password, 10)
        const updatedCustomer = await prisma.customer.update({
          where: { id: existingAny.id },
          data: {
            password: hashedPassword,
            name: name || existingAny.name,
            lastName: lastName || existingAny.lastName,
            phone: phone || existingAny.phone,
            source: existingAny.source || 'PORTAL'
          }
        })

        const verificationCode = generateVerificationCode()
        await setCode(updatedCustomer.email, verificationCode)

        const emailTemplate = getVerificationEmailTemplate(verificationCode, 'verification')
        await sendEmail({ to: updatedCustomer.email, subject: emailTemplate.subject, html: emailTemplate.html, text: emailTemplate.text })

        const response = NextResponse.json({
          success: true,
          customer: { id: updatedCustomer.id, email: updatedCustomer.email },
          message: 'Cuenta actualizada. Por favor verifica tu email.',
          requiresVerification: true
        })
        response.cookies.set('verification-pending', updatedCustomer.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 15,
          path: '/'
        })
        return response
      }

      // Ya existe con contraseña: no crear duplicado; guiar a autenticación cómoda (OTP)
      return NextResponse.json(
        { 
          error: 'Este email ya tiene una cuenta.',
          alreadyRegistered: true,
          needsAuth: true,
          method: 'otp'
        },
        { status: 409 }
      )
    }

    // Crear nuevo cliente en el tenant resuelto
    const hashedPassword = await bcrypt.hash(password, 10)
    const newCustomer = await prisma.customer.create({
      data: {
        tenantId,
        email: email.toLowerCase(),
        name,
        lastName,
        phone,
        password: hashedPassword,
        emailVerified: false,
        source: 'PORTAL'
      }
    })

    // Guardar contraseña en el historial
    await prisma.passwordHistory.create({
      data: {
        customerId: newCustomer.id,
        passwordHash: hashedPassword
      }
    })

    // Generar y guardar código en Redis y enviar email
    const verificationCode = generateVerificationCode()
    await setCode(newCustomer.email, verificationCode)
    const emailTemplate = getVerificationEmailTemplate(verificationCode, 'verification')
    await sendEmail({ to: newCustomer.email, subject: emailTemplate.subject, html: emailTemplate.html, text: emailTemplate.text })

    // Respuesta + cookie temporal de verificación
    const response = NextResponse.json({
      success: true,
      customer: { id: newCustomer.id, email: newCustomer.email },
      message: 'Cuenta creada exitosamente. Por favor verifica tu email.',
      requiresVerification: true
    })
    response.cookies.set('verification-pending', newCustomer.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 15,
      path: '/'
    })
    return response

  } catch (error) {
    logger.error('Register error:', error)
    return NextResponse.json(
      { error: 'Error al crear cuenta' },
      { status: 500 }
    )
  }
}
