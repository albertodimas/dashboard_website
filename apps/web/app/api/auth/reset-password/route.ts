import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import bcrypt from 'bcryptjs'
import { generateClientToken } from '@/lib/client-auth'
import { setAuthCookie } from '@/lib/jwt-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword, userType = 'user' } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    console.log(`Processing reset password for ${userType}:`, email)

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

      console.log('✅ Password reset successful for customer:', updatedCustomer.email)

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
      const storedCode = verificationStore.get(email)
      
      if (!storedCode || storedCode !== code) {
        console.error('❌ Invalid verification code for system user')
        return NextResponse.json(
          { error: 'Código de verificación inválido o expirado' },
          { status: 400 }
        )
      }
      
      // Limpiar el código usado
      verificationStore.delete(email)
      
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

      console.log('✅ Password reset successful for user:', updatedUser.email)

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
    console.error('Reset password error:', error)
    
    return NextResponse.json(
      { error: 'Error al restablecer contraseña' },
      { status: 500 }
    )
  }
}

// Asegurar ejecución en Node.js
export const runtime = 'nodejs'