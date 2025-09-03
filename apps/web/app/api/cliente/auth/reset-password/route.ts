import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { validatePasswordHistory, addPasswordToHistory, validatePasswordStrength } from '@/lib/password-utils'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, código y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Validar fortaleza de la contraseña
    const strengthValidation = validatePasswordStrength(newPassword)
    if (!strengthValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'La contraseña no cumple con los requisitos de seguridad',
          details: strengthValidation.errors 
        },
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

    // Marcar el código como usado
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { usedAt: new Date() }
    })

    // Validar contra el historial de contraseñas
    const historyValidation = await validatePasswordHistory(customer.id, newPassword)
    if (!historyValidation.isValid) {
      return NextResponse.json(
        { error: historyValidation.error },
        { status: 400 }
      )
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Actualizar la contraseña del cliente
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: { 
        password: hashedPassword,
        emailVerified: true // Aprovechar para verificar el email si no estaba verificado
      }
    })

    // Agregar la nueva contraseña al historial
    await addPasswordToHistory(customer.id, hashedPassword)

    // Generar token para auto-login
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