import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { jwtVerify, SignJWT } from 'jose'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Use same client token secret as other cliente endpoints
const CLIENT_JWT_SECRET = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET
if (!CLIENT_JWT_SECRET) {
  throw new Error('CLIENT_JWT_SECRET or JWT_SECRET environment variable is required')
}
const CLIENT_SECRET_BYTES = new TextEncoder().encode(CLIENT_JWT_SECRET)

// GET - Obtener perfil del cliente
export async function GET(request: NextRequest) {
  try {
    // Verificar token - primero intentar leer de cookie, luego de header
    let token: string | undefined
    
    // Intentar leer de cookie
    const cookieToken = request.cookies.get('client-token')?.value
    
    // Si no hay cookie, intentar leer del header Authorization
    const authHeader = request.headers.get('authorization')
    
    if (cookieToken) {
      token = cookieToken
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    let decoded: any

    try {
      const { payload } = await jwtVerify(token, CLIENT_SECRET_BYTES)
      decoded = payload
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener datos del cliente
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      customer
    })

  } catch (error) {
    logger.error('Error al obtener perfil:', error)
    return NextResponse.json(
      { error: 'Error al obtener el perfil' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar perfil del cliente
export async function PUT(request: NextRequest) {
  try {
    // Verificar token - primero intentar leer de cookie, luego de header
    let token: string | undefined
    
    // Intentar leer de cookie
    const cookieToken = request.cookies.get('client-token')?.value
    
    // Si no hay cookie, intentar leer del header Authorization
    const authHeader = request.headers.get('authorization')
    
    if (cookieToken) {
      token = cookieToken
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    let decoded: any

    try {
      const { payload } = await jwtVerify(token, CLIENT_SECRET_BYTES)
      decoded = payload
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, lastName, phone, address, city, state, postalCode } = body

    // Validaciones básicas
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      )
    }

    // Validar formato de teléfono (opcional)
    if (phone && phone.length > 0) {
      // Eliminar espacios y guiones
      const cleanPhone = phone.replace(/[\s-]/g, '')
      
      // Verificar que solo contenga números y posiblemente un +
      if (!/^\+?\d{7,15}$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'El teléfono debe contener entre 7 y 15 dígitos' },
          { status: 400 }
        )
      }
    }

    // Actualizar cliente
    const updatedCustomer = await prisma.customer.update({
      where: { id: decoded.customerId },
      data: {
        name: name.trim(),
        lastName: lastName ? lastName.trim() : null,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        postalCode: postalCode ? postalCode.trim() : null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        updatedAt: true
      }
    })

    // Generar nuevo token con datos actualizados
    const newToken = await new SignJWT({
      customerId: updatedCustomer.id,
      email: updatedCustomer.email,
      name: updatedCustomer.name,
      emailVerified: true
    } as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(CLIENT_SECRET_BYTES)

    // Crear respuesta con nuevo token
    const response = NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      customer: updatedCustomer
    })

    // Actualizar cookie con nuevo token
    response.cookies.set('client-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    })

    return response

  } catch (error) {
    logger.error('Error al actualizar perfil:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el perfil' },
      { status: 500 }
    )
  }
}
