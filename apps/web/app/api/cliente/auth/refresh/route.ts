import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { SignJWT, jwtVerify } from 'jose'

// Use same client token secret as login/middleware
const CLIENT_JWT_SECRET = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET
const REFRESH_SECRET = process.env.REFRESH_SECRET
if (!CLIENT_JWT_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets (CLIENT_JWT_SECRET or JWT_SECRET, and REFRESH_SECRET) are required')
}
const CLIENT_JWT_SECRET_BYTES = new TextEncoder().encode(CLIENT_JWT_SECRET)
const REFRESH_SECRET_BYTES = new TextEncoder().encode(REFRESH_SECRET)

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('client-token')?.value
    const refreshToken = request.cookies.get('client-refresh-token')?.value

    if (!token && !refreshToken) {
      return NextResponse.json(
        { error: 'No se encontró token de autenticación' },
        { status: 401 }
      )
    }

    // Try to decode the current token (might be expired); fallback to refresh token
    let customerId: string | null = null

    if (token) {
      try {
        const { payload } = await jwtVerify(token, CLIENT_JWT_SECRET_BYTES)
        customerId = (payload as any).customerId
      } catch {
        // ignore and try refresh token below
      }
    }

    if (!customerId && refreshToken) {
      try {
        const { payload } = await jwtVerify(refreshToken, REFRESH_SECRET_BYTES)
        customerId = (payload as any).customerId
      } catch {
        return NextResponse.json(
          { error: 'Token de actualización inválido' },
          { status: 401 }
        )
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No se pudo identificar el usuario' },
        { status: 401 }
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

    // Generate new tokens
    const newToken = await new SignJWT({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      emailVerified: customer.emailVerified
    } as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(CLIENT_JWT_SECRET_BYTES)

    const newRefreshToken = await new SignJWT({
      customerId: customer.id,
      type: 'refresh'
    } as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(REFRESH_SECRET_BYTES)

    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        emailVerified: customer.emailVerified
      }
    })

    response.cookies.set('client-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60,
      path: '/'
    })

    response.cookies.set('client-refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar token' },
      { status: 500 }
    )
  }
}
