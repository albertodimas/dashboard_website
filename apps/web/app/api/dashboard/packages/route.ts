import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentUser } from '@/lib/auth-utils'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findFirst({
      where: { tenantId: user.tenantId }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const packages = await prisma.package.findMany({
      where: { businessId: business.id },
      include: {
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    return NextResponse.json(packages)
  } catch (error) {
    logger.error('Error fetching packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findFirst({
      where: { tenantId: user.tenantId }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const data = await request.json()
    const { services, ...packageData } = data
    const name = (packageData.name || '').toString().trim()
    if (!name) return NextResponse.json({ error: 'Package name is required' }, { status: 400 })

    // Calcular duración total del paquete
    let totalDuration = 0
    let originalPrice = 0
    
    if (services && services.length > 0) {
      const serviceIds = services.map((s: any) => s.serviceId)
      const serviceDetails = await prisma.service.findMany({
        where: { id: { in: serviceIds } }
      })
      
      services.forEach((s: any) => {
        const service = serviceDetails.find(sd => sd.id === s.serviceId)
        if (service) {
          totalDuration += service.duration * (s.quantity || 1)
          originalPrice += service.price * (s.quantity || 1)
        }
      })
    }

    // Calculate final price with discount (60% discount = pay 40%)
    const finalPrice = originalPrice * (1 - (packageData.discount || 0) / 100)

    // Enforce unique name per business (case-insensitive)
    const dup = await prisma.package.findFirst({
      where: { businessId: business.id, name: { equals: name, mode: 'insensitive' } },
      select: { id: true }
    })
    if (dup) return NextResponse.json({ error: 'A package with this name already exists' }, { status: 409 })

    const newPackage = await prisma.package.create({
      data: {
        ...packageData,
        name,
        price: finalPrice,
        duration: totalDuration,
        originalPrice,
        tenantId: user.tenantId,
        businessId: business.id,
        services: {
          create: services?.map((s: any) => ({
            serviceId: s.serviceId,
            quantity: s.quantity || 1
          })) || []
        }
      },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    })

    return NextResponse.json(newPackage)
  } catch (error: any) {
    logger.error('Error creating package:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A package with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const packageId = searchParams.get('id')
    
    if (!packageId) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 })
    }

    const data = await request.json()
    const { services, ...packageData } = data

    // Verificar que el paquete pertenece al negocio del usuario
    const existingPackage = await prisma.package.findFirst({
      where: {
        id: packageId,
        business: { tenantId: user.tenantId }
      }
    })

    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Calcular duración total del paquete y precio original
    let totalDuration = 0
    let originalPrice = 0
    
    if (services && services.length > 0) {
      const serviceIds = services.map((s: any) => s.serviceId)
      const serviceDetails = await prisma.service.findMany({
        where: { id: { in: serviceIds } }
      })
      
      services.forEach((s: any) => {
        const service = serviceDetails.find(sd => sd.id === s.serviceId)
        if (service) {
          totalDuration += service.duration * (s.quantity || 1)
          originalPrice += service.price * (s.quantity || 1)
        }
      })
    }

    // Calculate final price with discount (60% discount = pay 40%)
    const finalPrice = originalPrice * (1 - (packageData.discount || 0) / 100)

    // Actualizar paquete y sus servicios
    // Ensure name uniqueness if it changes
    const newName = packageData.name !== undefined ? (packageData.name || '').toString().trim() : undefined
    if (newName) {
      const dup = await prisma.package.findFirst({
        where: { businessId: existingPackage.businessId, name: { equals: newName, mode: 'insensitive' }, NOT: { id: packageId } },
        select: { id: true }
      })
      if (dup) return NextResponse.json({ error: 'A package with this name already exists' }, { status: 409 })
    }

    const updatedPackage = await prisma.$transaction(async (tx) => {
      // Eliminar servicios existentes
      await tx.packageService.deleteMany({
        where: { packageId }
      })

      // Actualizar paquete con nuevos servicios
      return tx.package.update({
        where: { id: packageId },
        data: {
          ...packageData,
          ...(newName ? { name: newName } : {}),
          price: finalPrice,
          duration: totalDuration,
          originalPrice,
          services: {
            create: services?.map((s: any) => ({
              serviceId: s.serviceId,
              quantity: s.quantity || 1
            })) || []
          }
        },
        include: {
          services: {
            include: {
              service: true
            }
          }
        }
      })
    })

    return NextResponse.json(updatedPackage)
  } catch (error: any) {
    logger.error('Error updating package:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A package with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const packageId = searchParams.get('id')
    
    if (!packageId) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 })
    }

    // Verificar que el paquete pertenece al negocio del usuario
    const existingPackage = await prisma.package.findFirst({
      where: {
        id: packageId,
        business: { tenantId: user.tenantId }
      }
    })

    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    await prisma.package.delete({
      where: { id: packageId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting package:', error)
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
  }
}
