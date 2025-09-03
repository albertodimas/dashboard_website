import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { generateVerificationCode } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Buscar el cliente
    const customer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase()
      }
    })

    // Por seguridad, siempre devolver éxito aunque el email no exista
    if (!customer) {
      return NextResponse.json({
        success: true,
        message: 'Si el email existe, recibirás un código de verificación'
      })
    }

    // Invalidar códigos anteriores
    await prisma.verificationCode.updateMany({
      where: {
        customerId: customer.id,
        type: 'PASSWORD_RESET',
        usedAt: null
      },
      data: { usedAt: new Date() }
    })

    // Generar nuevo código
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    await prisma.verificationCode.create({
      data: {
        customerId: customer.id,
        code: verificationCode,
        type: 'PASSWORD_RESET',
        expiresAt
      }
    })

    // Crear el HTML del email
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">
            Restablecer Contraseña
          </h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:
          </p>
          
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px; border: 2px dashed #667eea;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">
              ${verificationCode}
            </span>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Este código expirará en <strong>15 minutos</strong>.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Este es un mensaje automático, por favor no respondas a este email.
          </p>
        </div>
      </div>
    `

    const emailText = `
Restablecer Contraseña

Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:

Código: ${verificationCode}

Este código expirará en 15 minutos.

Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
    `

    try {
      // Usar la API interna para enviar el email
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/internal/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: customer.email,
          subject: 'Restablecer contraseña - Código de verificación',
          html: emailHTML,
          text: emailText,
          from: `"Sistema de Reservas" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('✅ Password reset email sent to:', customer.email)
        console.log('Message ID:', result.messageId)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      } else {
        throw new Error('Failed to send email via internal API')
      }
      
    } catch (emailError: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ Failed to send password reset email')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Error:', emailError.message)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📧 CÓDIGO DE VERIFICACIÓN (para uso manual):')
      console.log('Email:', customer.email)
      console.log('Código:', verificationCode)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }

    return NextResponse.json({
      success: true,
      message: 'Si el email existe, recibirás un código de verificación'
    })

  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    )
  }
}

// Asegurar ejecución en Node.js (Prisma + fetch interno)
export const runtime = 'nodejs'
