import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { code, customerId } = await request.json()

    if (!code || !customerId) {
      return NextResponse.json(
        { error: 'Código y ID de cliente son requeridos' },
        { status: 400 }
      )
    }

    // Buscar el código de verificación
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        customerId,
        code,
        type: 'EMAIL_VERIFICATION',
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        customer: true
      }
    })

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Código inválido o expirado' },
        { status: 400 }
      )
    }

    // Marcar el código como usado
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { usedAt: new Date() }
    })

    // Actualizar el cliente como verificado
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: { emailVerified: true }
    })

    // Generar nuevo token con emailVerified = true
    const token = jwt.sign(
      { 
        customerId: updatedCustomer.id,
        email: updatedCustomer.email,
        name: updatedCustomer.name,
        emailVerified: true
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

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
      message: 'Email verificado exitosamente'
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Error al verificar el código' },
      { status: 500 }
    )
  }
}

// Endpoint para reenviar código
export async function PUT(request: NextRequest) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: 'ID de cliente es requerido' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Invalidar códigos anteriores
    await prisma.verificationCode.updateMany({
      where: {
        customerId,
        type: 'EMAIL_VERIFICATION',
        usedAt: null
      },
      data: { usedAt: new Date() }
    })

    // Generar nuevo código
    const { generateVerificationCode } = await import('@/lib/email')
    const newCode = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    await prisma.verificationCode.create({
      data: {
        customerId,
        code: newCode,
        type: 'EMAIL_VERIFICATION',
        expiresAt
      }
    })

    // Enviar nuevo email
    const { sendEmail, getVerificationEmailTemplate } = await import('@/lib/email')
    const emailTemplate = getVerificationEmailTemplate(newCode, 'verification')
    
    await sendEmail({
      to: customer.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    })

    return NextResponse.json({
      success: true,
      message: 'Código reenviado exitosamente'
    })

  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { error: 'Error al reenviar código' },
      { status: 500 }
    )
  }
}