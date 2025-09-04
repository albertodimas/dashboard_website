import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import bcrypt from 'bcryptjs'
import { generateClientToken } from '@/lib/client-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, código y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar el cliente
    const customer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase()
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Código inválido o expirado' },
        { status: 400 }
      )
    }

    // Verificar el código
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        customerId: customer.id,
        code,
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
    
    // Actualizar la contraseña del cliente y marcar código como usado en una transacción
    const [updatedCustomer, _] = await prisma.$transaction([
      prisma.customer.update({
        where: { id: customer.id },
        data: { 
          password: hashedPassword,
          emailVerified: true // Aprovechar para verificar el email si no estaba verificado
        }
      }),
      prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { usedAt: new Date() }
      })
    ])

    // Generar token para auto-login
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
      message: 'Contraseña actualizada exitosamente'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Error al restablecer contraseña' },
      { status: 500 }
    )
  }
}