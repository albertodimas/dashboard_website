import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

// GET all services for the business
export async function GET() {
  try {
    // Get default business for now (in production, get from session)
    const business = await prisma.business.findFirst({
      where: { slug: 'default-business' }
    })

    if (!business) {
      // If no business exists, return empty array
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
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

// POST create service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get default business
    const business = await prisma.business.findFirst({
      where: { slug: 'default-business' }
    })

    if (!business) {
      // Create default business if it doesn't exist
      const tenant = await prisma.tenant.findFirst({
        where: { subdomain: 'default' }
      }) || await prisma.tenant.create({
        data: {
          name: 'Default Tenant',
          subdomain: 'default',
          email: 'admin@dashboard.com'
        }
      })

      const newBusiness = await prisma.business.create({
        data: {
          tenantId: tenant.id,
          name: 'My Business',
          slug: 'default-business',
          email: 'business@dashboard.com',
          phone: '555-0100',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          timezone: 'America/New_York'
        }
      })

      const service = await prisma.service.create({
        data: {
          tenantId: tenant.id,
          businessId: newBusiness.id,
          name: body.name,
          description: body.description,
          duration: body.duration,
          price: body.price,
          category: body.category,
          isActive: body.isActive ?? true
        }
      })

      return NextResponse.json({ service })
    }

    const service = await prisma.service.create({
      data: {
        tenantId: business.tenantId,
        businessId: business.id,
        name: body.name,
        description: body.description,
        duration: body.duration,
        price: body.price,
        category: body.category,
        isActive: body.isActive ?? true
      }
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}

// PUT update service
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    const service = await prisma.service.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        duration: body.duration,
        price: body.price,
        category: body.category,
        isActive: body.isActive
      }
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

// DELETE service
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    await prisma.service.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}