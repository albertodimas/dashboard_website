import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-utils'

export async function POST(request: Request) {
  console.log('🧹 Clear data endpoint called')
  
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    console.log('User info:', { userId: user?.id, tenantId: user?.tenantId })
    
    if (!user || !user.tenantId) {
      console.error('Unauthorized - missing auth')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tenantId = user.tenantId

    // Buscar el negocio del tenant
    const business = await prisma.business.findFirst({
      where: { tenantId },
      select: { id: true }
    })

    console.log('Business found:', business)

    if (!business) {
      console.error('Business not found for tenant:', tenantId)
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const businessId = business.id
    console.log('Starting data deletion for business:', businessId)

    // Eliminar todos los datos relacionados con el negocio
    // El orden es importante debido a las relaciones de clave foránea
    
    console.log('Deleting appointments...')
    // 1. Eliminar citas
    const appointmentsDeleted = await prisma.appointment.deleteMany({
      where: { businessId }
    })
    console.log(`Deleted ${appointmentsDeleted.count} appointments`)

    console.log('Deleting packages...')
    // 2. Eliminar paquetes
    const packagesDeleted = await prisma.package.deleteMany({
      where: { businessId }
    })
    console.log(`Deleted ${packagesDeleted.count} packages`)

    console.log('Deleting services...')
    // 3. Eliminar servicios
    const servicesDeleted = await prisma.service.deleteMany({
      where: { businessId }
    })
    console.log(`Deleted ${servicesDeleted.count} services`)

    console.log('Deleting staff...')
    // 3. Eliminar staff
    const staffDeleted = await prisma.staff.deleteMany({
      where: { businessId }
    })
    console.log(`Deleted ${staffDeleted.count} staff members`)

    console.log('Deleting customers...')
    // 4. Eliminar clientes del tenant
    const customersDeleted = await prisma.customer.deleteMany({
      where: { tenantId }
    })
    console.log(`Deleted ${customersDeleted.count} customers`)

    console.log('Resetting business configuration...')
    // 5. Limpiar configuraciones del negocio (pero mantener el negocio)
    await prisma.business.update({
      where: { id: businessId },
      data: {
        // Resetear configuraciones opcionales
        settings: {},
        features: {},
        businessType: null,
        // Mantener información básica del negocio
        // pero limpiar módulos y características
      }
    })

    console.log('✅ All data cleared successfully')
    
    return NextResponse.json({
      success: true,
      message: 'All business data has been cleared successfully'
    })

  } catch (error) {
    console.error('❌ Error clearing business data:', error)
    return NextResponse.json(
      { error: 'Failed to clear business data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}