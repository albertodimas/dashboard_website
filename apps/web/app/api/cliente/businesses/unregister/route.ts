import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// DELETE - Desregistrar cliente de un negocio
export async function DELETE(request: NextRequest) {
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
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener el businessId del body
    const body = await request.json()
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json(
        { error: 'ID del negocio es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el negocio existe
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si hay citas futuras pendientes
    const futureAppointments = await prisma.appointment.count({
      where: {
        customerId: decoded.customerId,
        businessId,
        startTime: { gte: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    })

    if (futureAppointments > 0) {
      return NextResponse.json(
        { 
          error: 'No puedes desregistrarte mientras tengas citas pendientes',
          futureAppointments 
        },
        { status: 400 }
      )
    }

    // Verificar si hay paquetes activos
    const activePackages = await prisma.packagePurchase.count({
      where: {
        customerId: decoded.customerId,
        businessId,
        status: 'ACTIVE',
        remainingSessions: { gt: 0 }
      }
    })

    if (activePackages > 0) {
      return NextResponse.json(
        { 
          error: 'No puedes desregistrarte mientras tengas paquetes activos con sesiones disponibles',
          activePackages 
        },
        { status: 400 }
      )
    }

    // Como no hay una tabla de relación directa, marcamos al cliente como "desregistrado"
    // mediante metadata en el cliente o creando un registro de "desregistro"
    
    // Opción 1: Actualizar metadata del cliente para trackear negocios desregistrados
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
      select: { metadata: true }
    })

    const currentMetadata = customer?.metadata as any || {}
    const unregisteredBusinesses = currentMetadata.unregisteredBusinesses || []
    
    if (!unregisteredBusinesses.includes(businessId)) {
      unregisteredBusinesses.push(businessId)
    }

    await prisma.customer.update({
      where: { id: decoded.customerId },
      data: {
        metadata: {
          ...currentMetadata,
          unregisteredBusinesses,
          [`unregisteredFrom_${businessId}`]: new Date().toISOString()
        }
      }
    })

    // Opcional: Registrar esta acción para análisis
    console.log(`Cliente ${decoded.customerId} se desregistró del negocio ${businessId}`)

    return NextResponse.json({
      success: true,
      message: 'Te has desregistrado exitosamente del negocio'
    })

  } catch (error) {
    console.error('Error al desregistrar del negocio:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}