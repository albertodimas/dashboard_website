import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

// GET available staff for a business/service
export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string[] } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    
    // Join the businessId array to handle paths with slashes
    const businessIdentifier = params.businessId.join('/')
    console.log('Looking for business with identifier:', businessIdentifier)
    
    // Check if the identifier is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessIdentifier)
    
    // Build the where clause based on identifier type with proper typing
    type WhereClause = {
      OR: Array<{ id?: string; slug?: string; customSlug?: string }>
    }
    
    let whereClause: WhereClause
    if (isUUID) {
      whereClause = {
        OR: [
          { id: businessIdentifier },
          { slug: businessIdentifier },
          { customSlug: businessIdentifier }
        ]
      }
    } else {
      // If not a UUID, only search by slug or customSlug
      whereClause = {
        OR: [
          { slug: businessIdentifier },
          { customSlug: businessIdentifier }
        ]
      }
    }
    
    // First check if the business has staff module enabled
    const business = await prisma.business.findFirst({
      where: whereClause,
      select: {
        id: true,
        enableStaffModule: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // If staff module is not enabled, return empty array
    if (!business.enableStaffModule) {
      return NextResponse.json({ staff: [], moduleEnabled: false })
    }

    // Get all active staff for the business
    let query: any = {
      where: {
        businessId: business.id,
        isActive: true,
        canAcceptBookings: true
      },
      include: {
        workingHours: {
          where: { isActive: true }
        }
      }
    }

    // If serviceId is provided, filter by staff assigned to that service
    if (serviceId) {
      console.log('Filtering staff for serviceId:', serviceId)
      query.where = {
        ...query.where,
        serviceStaff: {
          some: {
            serviceId: serviceId
          }
        }
      }
    }

    console.log('Staff query:', JSON.stringify(query, null, 2))
    const staff = await prisma.staff.findMany(query)
    console.log('Staff found:', staff.length)

    // Format response with only necessary public info
    const formattedStaff = staff.map(s => ({
      id: s.id,
      name: s.name,
      photo: s.photo,
      bio: s.bio,
      specialties: s.specialties,
      rating: s.rating,
      totalReviews: s.totalReviews,
      workingHours: s.workingHours.map(wh => ({
        dayOfWeek: wh.dayOfWeek,
        startTime: wh.startTime,
        endTime: wh.endTime
      }))
    }))

    return NextResponse.json({ 
      staff: formattedStaff,
      moduleEnabled: true 
    })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}