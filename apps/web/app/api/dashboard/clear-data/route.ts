import { NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { getCurrentUser } from '@/lib/auth-utils'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  logger.info('🧹 Clear data endpoint called')
  
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    logger.info('User info:', { userId: user?.id, tenantId: user?.tenantId })
    
    if (!user || !user.tenantId) {
      logger.error('Unauthorized - missing auth')
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

    logger.info('Business found:', business)

    if (!business) {
      logger.error('Business not found for tenant:', tenantId)
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const businessId = business.id
    logger.info('Starting data deletion for business:', businessId)

    // Eliminar todos los datos relacionados con el negocio
    // El orden es importante debido a las relaciones de clave foránea
    
    logger.info('Deleting appointments...')
    // 1. Eliminar citas
    const appointmentsDeleted = await prisma.appointment.deleteMany({
      where: { businessId }
    })
    logger.info(`Deleted ${appointmentsDeleted.count} appointments`)

    logger.info('Deleting packages...')
    // 2. Eliminar paquetes
    const packagesDeleted = await prisma.package.deleteMany({
      where: { businessId }
    })
    logger.info(`Deleted ${packagesDeleted.count} packages`)

    logger.info('Deleting services...')
    // 3. Eliminar servicios
    const servicesDeleted = await prisma.service.deleteMany({
      where: { businessId }
    })
    logger.info(`Deleted ${servicesDeleted.count} services`)

    logger.info('Deleting staff...')
    // 3. Eliminar staff
    const staffDeleted = await prisma.staff.deleteMany({
      where: { businessId }
    })
    logger.info(`Deleted ${staffDeleted.count} staff members`)

    logger.info('Deleting customers...')
    // 4. Eliminar clientes del tenant
    const customersDeleted = await prisma.customer.deleteMany({
      where: { tenantId }
    })
    logger.info(`Deleted ${customersDeleted.count} customers`)

    logger.info('Resetting business configuration...')
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

    logger.info('✅ All data cleared successfully')
    
    return NextResponse.json({
      success: true,
      message: 'All business data has been cleared successfully'
    })

  } catch (error) {
    logger.error('❌ Error clearing business data:', error)
    return NextResponse.json(
      { error: 'Failed to clear business data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}