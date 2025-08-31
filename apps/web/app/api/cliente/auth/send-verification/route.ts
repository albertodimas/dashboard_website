import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import crypto from 'crypto'

// Simple in-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: Date; data: any }>()

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, phone } = await request.json()

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, nombre y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Check if email is already registered with password
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase(),
        password: { not: null }
      }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      )
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store verification code with 10 minute expiry
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    verificationCodes.set(email.toLowerCase(), {
      code,
      expires,
      data: { email, name, password, phone }
    })

    // In production, send email with code
    // For now, we'll return it in the response (development only)
    console.log(`Verification code for ${email}: ${code}`)
    
    // In a real application, you would send an email here
    // await sendEmail({
    //   to: email,
    //   subject: 'Código de verificación',
    //   text: `Tu código de verificación es: ${code}`
    // })

    return NextResponse.json({
      success: true,
      message: 'Código de verificación enviado',
      // Remove this in production - only for development
      devCode: process.env.NODE_ENV === 'development' ? code : undefined
    })

  } catch (error) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { error: 'Error al enviar código de verificación' },
      { status: 500 }
    )
  }
}

// Clean up expired codes periodically
setInterval(() => {
  const now = new Date()
  for (const [email, data] of verificationCodes.entries()) {
    if (data.expires < now) {
      verificationCodes.delete(email)
    }
  }
}, 60000) // Clean every minute