import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'

// GET all services for the business
export async function GET() {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return NextResponse.json({ services: [] })
    }

    const services = await prisma.service.findMany({
      where: {
        businessId: business.id
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return createAuthResponse('Failed to fetch services', 500)
  }
}

// POST create service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // Create the service
    const service = await prisma.service.create({
      data: {
        name: body.name,
        description: body.description,
        duration: body.duration,
        price: body.price,
        category: body.category,
        businessId: business.id,
        tenantId: business.tenantId,
        isActive: body.isActive !== undefined ? body.isActive : true,
        allowOnline: body.allowOnline !== undefined ? body.allowOnline : true,
        allowHomeService: body.allowHomeService !== undefined ? body.allowHomeService : false
      }
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error creating service:', error)
    return createAuthResponse('Failed to create service', 500)
  }
}

// PUT update service
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return createAuthResponse('Service ID is required', 400)
    }

    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // Verify the service belongs to this business
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        businessId: business.id
      }
    })

    if (!existingService) {
      return createAuthResponse('Service not found', 404)
    }

    // Update the service
    const service = await prisma.service.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error updating service:', error)
    return createAuthResponse('Failed to update service', 500)
  }
}

// DELETE service
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return createAuthResponse('Service ID is required', 400)
    }

    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // Verify the service belongs to this business
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        businessId: business.id
      }
    })

    if (!existingService) {
      return createAuthResponse('Service not found', 404)
    }

    // Delete the service
    await prisma.service.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return createAuthResponse('Failed to delete service', 500)
  }
}