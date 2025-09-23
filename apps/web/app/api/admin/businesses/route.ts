import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

type BusinessWithRelations = {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  city: string | null
  state: string | null
  isActive: boolean
  isPremium: boolean
  isBlocked: boolean
  blockedReason: string | null
  blockedAt: Date | null
  businessCategory?: string | null
  categoryId: string | null
  category: {
    id: string
    name: string
    slug: string
    icon: string | null
  } | null
  enableStaffModule: boolean
  enablePackagesModule: boolean
  tenant: {
    name: string
    email: string
    subdomain: string
  }
  _count: {
    appointments: number
    services: number
    staff: number
  }
  createdAt: Date
  updatedAt: Date
}

const businessInclude = {
  tenant: {
    select: {
      name: true,
      email: true,
      subdomain: true
    }
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true
    }
  },
  _count: {
    select: {
      appointments: true,
      services: true,
      staff: true
    }
  }
} as const

// GET all businesses (admin only)
export async function GET() {
  try {
    const businesses = (await prisma.business.findMany({
      include: businessInclude,
      orderBy: { createdAt: 'desc' }
    })) as BusinessWithRelations[]

    // Format businesses with additional info
    const formattedBusinesses = businesses.map(business => {
      const businessCategory =
        (business as { businessCategory?: string | null }).businessCategory ??
        business.category?.name ??
        null

      return {
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
        businessCategory,
        categoryId: business.categoryId,
        category: business.category,
        enableStaffModule: business.enableStaffModule,
        enablePackagesModule: business.enablePackagesModule,
        tenantName: business.tenant.name,
        tenantEmail: business.tenant.email,
        subdomain: business.tenant.subdomain,
        appointmentsCount: business._count.appointments,
        servicesCount: business._count.services,
        staffCount: business._count.staff,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt
      }
    })

    return NextResponse.json(formattedBusinesses)
  } catch (error) {
    logger.error('Error fetching businesses:', error)
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
    
    logger.info('PUT request body:', body)
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.isPremium !== undefined) updateData.isPremium = body.isPremium
    if (body.businessCategory !== undefined) updateData.businessCategory = body.businessCategory
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.enableStaffModule !== undefined) updateData.enableStaffModule = body.enableStaffModule
    if (body.enablePackagesModule !== undefined) {
      logger.info('Setting enablePackagesModule to:', body.enablePackagesModule)
      updateData.enablePackagesModule = body.enablePackagesModule
    }
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

    logger.info('Update data:', updateData)
    logger.info('Business ID:', body.id)
    
    const business = await prisma.business.update({
      where: { id: body.id },
      data: updateData
    })

    return NextResponse.json({ 
      success: true,
      business 
    })
  } catch (error) {
    logger.error('Error updating business:', error)
    logger.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update business' },
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
    logger.error('Error deleting business:', error)
    return NextResponse.json(
      { error: 'Failed to delete business' },
      { status: 500 }
    )
  }
}
