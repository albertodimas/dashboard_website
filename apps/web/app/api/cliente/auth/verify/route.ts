import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Código es requerido' },
        { status: 400 }
      )
    }

    // Obtener el customerId de la cookie temporal
    const customerId = request.cookies.get('verification-pending')?.value

    if (!customerId) {
      return NextResponse.json(
        { error: 'No hay verificación pendiente' },
        { status: 401 }
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
      // Verificar si el código existe pero ya fue usado
      const usedCode = await prisma.verificationCode.findFirst({
        where: {
          customerId,
          code,
          type: 'EMAIL_VERIFICATION',
          usedAt: { not: null }
        }
      })

      if (usedCode) {
        return NextResponse.json(
          { error: 'Este código ya fue utilizado' },
          { status: 400 }
        )
      }

      // Verificar si el código existe pero expiró
      const expiredCode = await prisma.verificationCode.findFirst({
        where: {
          customerId,
          code,
          type: 'EMAIL_VERIFICATION',
          expiresAt: {
            lte: new Date()
          }
        }
      })

      if (expiredCode) {
        return NextResponse.json(
          { error: 'El código ha expirado. Solicita uno nuevo.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Código incorrecto' },
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

    // Limpiar la cookie temporal de verificación
    const response = NextResponse.json({
      success: true,
      message: 'Email verificado exitosamente. Por favor inicia sesión.'
    })

    // Eliminar la cookie de verificación pendiente
    response.cookies.delete('verification-pending')

    return response

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Error al verificar código' },
      { status: 500 }
    )
  }
}