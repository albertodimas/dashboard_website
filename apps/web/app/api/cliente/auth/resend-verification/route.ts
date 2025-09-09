import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import jwt from 'jsonwebtoken'
import { sendEmail, getVerificationEmailTemplate, generateVerificationCode } from '@/lib/email'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    // Obtener el customerId de la cookie temporal
    const customerId = request.cookies.get('verification-pending')?.value

    if (!customerId) {
      return NextResponse.json(
        { error: 'No hay verificación pendiente' },
        { status: 401 }
      )
    }

    // Buscar el cliente
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Si ya está verificado, no es necesario reenviar
    if (customer.emailVerified) {
      return NextResponse.json(
        { error: 'El email ya está verificado' },
        { status: 400 }
      )
    }

    // Verificar si hay un código activo reciente (menos de 1 minuto)
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        customerId: customer.id,
        type: 'EMAIL_VERIFICATION',
        expiresAt: { gt: new Date() },
        createdAt: { gt: new Date(Date.now() - 60 * 1000) } // Menos de 1 minuto
      }
    })

    if (recentCode) {
      return NextResponse.json(
        { error: 'Debes esperar 1 minuto antes de solicitar un nuevo código' },
        { status: 429 }
      )
    }

    // Invalidar códigos anteriores
    await prisma.verificationCode.updateMany({
      where: {
        customerId: customer.id,
        type: 'EMAIL_VERIFICATION',
        usedAt: null
      },
      data: {
        usedAt: new Date()
      }
    })

    // Generar nuevo código
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    // Guardar el código en la base de datos
    await prisma.verificationCode.create({
      data: {
        customerId: customer.id,
        code: verificationCode,
        type: 'EMAIL_VERIFICATION',
        expiresAt
      }
    })

    // Enviar email
    const emailTemplate = getVerificationEmailTemplate(verificationCode, 'verification')
    await sendEmail({
      to: customer.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    })

    // En desarrollo, también devolver el código
    const isDev = process.env.NODE_ENV === 'development'

    return NextResponse.json({
      success: true,
      message: 'Código de verificación reenviado',
      ...(isDev && { devCode: verificationCode })
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Error al reenviar código' },
      { status: 500 }
    )
  }
}