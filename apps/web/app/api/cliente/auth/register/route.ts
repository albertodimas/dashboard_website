import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { sendEmail, getVerificationEmailTemplate, generateVerificationCode } from '@/lib/email'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el cliente ya existe
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase()
      }
    })

    if (existingCustomer) {
      // Si existe pero no tiene contraseña, actualizar
      if (!existingCustomer.password) {
        const hashedPassword = await bcrypt.hash(password, 10)
        
        const updatedCustomer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            password: hashedPassword,
            name: name || existingCustomer.name,
            phone: phone || existingCustomer.phone
          }
        })

        // Generar código de verificación
        const verificationCode = generateVerificationCode()
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

        // Guardar código en la base de datos
        await prisma.verificationCode.create({
          data: {
            customerId: updatedCustomer.id,
            code: verificationCode,
            type: 'EMAIL_VERIFICATION',
            expiresAt
          }
        })

        // Enviar email de verificación
        const emailTemplate = getVerificationEmailTemplate(verificationCode, 'verification')
        await sendEmail({
          to: updatedCustomer.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        })

        // Generar token (pero el usuario no estará verificado)
        const token = jwt.sign(
          { 
            customerId: updatedCustomer.id,
            email: updatedCustomer.email,
            name: updatedCustomer.name,
            emailVerified: false
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
            emailVerified: false
          },
          message: 'Cuenta actualizada. Por favor verifica tu email.',
          requiresVerification: true
        })
      } else {
        return NextResponse.json(
          { error: 'Este email ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Crear nuevo cliente
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Obtener el primer tenant disponible (o crear lógica para asignar tenant)
    const defaultTenant = await prisma.tenant.findFirst()
    
    if (!defaultTenant) {
      return NextResponse.json(
        { error: 'Error de configuración del sistema' },
        { status: 500 }
      )
    }

    const newCustomer = await prisma.customer.create({
      data: {
        tenantId: defaultTenant.id,
        email: email.toLowerCase(),
        name,
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

    // Generar código de verificación
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    // Guardar código en la base de datos
    await prisma.verificationCode.create({
      data: {
        customerId: newCustomer.id,
        code: verificationCode,
        type: 'EMAIL_VERIFICATION',
        expiresAt
      }
    })

    // Enviar email de verificación
    const emailTemplate = getVerificationEmailTemplate(verificationCode, 'verification')
    await sendEmail({
      to: newCustomer.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    })

    // Generar token
    const token = jwt.sign(
      { 
        customerId: newCustomer.id,
        email: newCustomer.email,
        name: newCustomer.name,
        emailVerified: false
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        emailVerified: false
      },
      message: 'Cuenta creada exitosamente. Por favor verifica tu email.',
      requiresVerification: true
    })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Error al crear cuenta' },
      { status: 500 }
    )
  }
}