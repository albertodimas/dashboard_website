import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { logger } from '@/lib/logger'

// GET public services for a business
export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    // Check if businessId is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.businessId)
    
    // Find business by ID, slug, or customSlug
    const business = await prisma.business.findFirst({
      where: { 
        OR: [
          ...(isUUID ? [{ id: params.businessId }] : []),
          { slug: params.businessId },
          { customSlug: params.businessId }
        ],
        isActive: true,
        isBlocked: false
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get active services for this business
    const services = await prisma.service.findMany({
      where: {
        businessId: business.id,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Get service-staff assignments
    const serviceStaffAssignments = await prisma.serviceStaff.findMany({
      where: {
        serviceId: {
          in: services.map(s => s.id)
        }
      }
    })
    
    // Format the response to include assignedStaff as an array of IDs
    const formattedServices = services.map(service => {
      const assignedStaff = serviceStaffAssignments
        .filter(ss => ss.serviceId === service.id)
        .map(ss => ss.staffId)
      
      return {
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        category: service.category,
        isActive: service.isActive,
        assignedStaff
      }
    })

    return NextResponse.json(formattedServices)
  } catch (error) {
    logger.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}