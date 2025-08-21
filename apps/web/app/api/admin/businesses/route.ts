import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

// GET all businesses (admin only)
export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        tenant: {
          select: {
            name: true,
            email: true,
            subdomain: true
          }
        },
        _count: {
          select: {
            appointments: true,
            services: true,
            staff: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format businesses with additional info
    const formattedBusinesses = businesses.map(business => ({
      id: business.id,
      name: business.name,
      slug: business.slug,
      email: business.email,
      phone: business.phone,
      city: business.city,
      state: business.state,
      isActive: business.isActive,
      isPremium: business.isPremium,
      isBlocked: business.isBlocked,
      blockedReason: business.blockedReason,
      blockedAt: business.blockedAt,
      tenantName: business.tenant.name,
      tenantEmail: business.tenant.email,
      subdomain: business.tenant.subdomain,
      appointmentsCount: business._count.appointments,
      servicesCount: business._count.services,
      staffCount: business._count.staff,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt
    }))

    return NextResponse.json(formattedBusinesses)
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    )
  }
}

// PUT update business status (activate/deactivate)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.isPremium !== undefined) updateData.isPremium = body.isPremium
    if (body.isBlocked !== undefined) {
      updateData.isBlocked = body.isBlocked
      if (body.isBlocked) {
        updateData.blockedAt = new Date()
        updateData.blockedReason = body.blockedReason || 'Not specified'
        updateData.isActive = false // Also deactivate when blocking
      } else {
        updateData.blockedAt = null
        updateData.blockedReason = null
        updateData.isActive = true // Reactivate when unblocking
      }
    }

    const business = await prisma.business.update({
      where: { id: body.id },
      data: updateData
    })

    return NextResponse.json({ 
      success: true,
      business 
    })
  } catch (error) {
    console.error('Error updating business:', error)
    return NextResponse.json(
      { error: 'Failed to update business' },
      { status: 500 }
    )
  }
}

// DELETE business (this will cascade delete all related data)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Delete the business (this will cascade delete all related data)
    await prisma.business.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Business and all related data deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting business:', error)
    return NextResponse.json(
      { error: 'Failed to delete business' },
      { status: 500 }
    )
  }
}