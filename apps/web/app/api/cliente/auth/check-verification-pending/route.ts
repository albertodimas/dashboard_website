import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

export async function GET(request: NextRequest) {
  try {
    // Obtener el ID de la cookie temporal
    const customerId = request.cookies.get('verification-pending')?.value

    if (!customerId) {
      return NextResponse.json(
        { error: 'No hay verificación pendiente' },
        { status: 404 }
      )
    }

    // Buscar el cliente
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        emailVerified: true
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Si ya está verificado, no debería estar aquí
    if (customer.emailVerified) {
      const response = NextResponse.json(
        { error: 'Email ya verificado' },
        { status: 400 }
      )
      // Limpiar la cookie
      response.cookies.delete('verification-pending')
      return response
    }

    return NextResponse.json({
      success: true,
      email: customer.email,
      customerId: customer.id
    })

  } catch (error) {
    console.error('Check verification pending error:', error)
    return NextResponse.json(
      { error: 'Error al verificar estado' },
      { status: 500 }
    )
  }
}