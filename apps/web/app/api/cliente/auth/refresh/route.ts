import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-change-in-production'

export async function POST(request: NextRequest) {
  try {
    // Get the current token from cookie
    const token = request.cookies.get('client-token')?.value
    const refreshToken = request.cookies.get('client-refresh-token')?.value

    if (!token && !refreshToken) {
      return NextResponse.json(
        { error: 'No se encontró token de autenticación' },
        { status: 401 }
      )
    }

    // Try to decode the current token (might be expired)
    let customerId: string | null = null
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        // Token is still valid, just refresh it
        customerId = decoded.customerId
      } catch (error: any) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
          // Token expired, try refresh token
          try {
            const refreshDecoded = jwt.verify(refreshToken, REFRESH_SECRET) as any
            customerId = refreshDecoded.customerId
          } catch (refreshError) {
            return NextResponse.json(
              { error: 'Token de actualización inválido' },
              { status: 401 }
            )
          }
        } else {
          return NextResponse.json(
            { error: 'Token inválido' },
            { status: 401 }
          )
        }
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No se pudo identificar el usuario' },
        { status: 401 }
      )
    }

    // Get fresh customer data
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
    const newToken = jwt.sign(
      { 
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
        emailVerified: customer.emailVerified
      },
      JWT_SECRET,
      { expiresIn: '1h' } // Shorter lived access token
    )

    const newRefreshToken = jwt.sign(
      { 
        customerId: customer.id,
        type: 'refresh'
      },
      REFRESH_SECRET,
      { expiresIn: '30d' } // Longer lived refresh token
    )

    // Create response
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

    // Set new cookies
    response.cookies.set('client-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    })

    response.cookies.set('client-refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Stricter for refresh token
      maxAge: 60 * 60 * 24 * 30, // 30 days
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