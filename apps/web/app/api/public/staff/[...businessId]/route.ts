import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@dashboard/db'
import { logger } from '@/lib/logger'

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
    logger.info('Looking for business with identifier:', businessIdentifier)

    // Check if the identifier is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessIdentifier)

    // Build the where clause based on identifier type with proper typing
    const whereClause: Prisma.BusinessWhereInput = isUUID
      ? {
          OR: [
            { id: businessIdentifier },
            { slug: businessIdentifier },
            { customSlug: businessIdentifier },
          ],
        }
      : {
          OR: [
            { slug: businessIdentifier },
            { customSlug: businessIdentifier },
          ],
        }

    // First check if the business has staff module enabled
    const business = await prisma.business.findFirst({
      where: whereClause,
      select: {
        id: true,
        settings: true,
        features: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const businessSettings = business.settings as { enableStaffModule?: boolean } | null | undefined
    const businessFeatures = business.features as { enableStaffModule?: boolean } | null | undefined
    const staffModuleEnabled = Boolean(
      businessSettings?.enableStaffModule ?? businessFeatures?.enableStaffModule
    )

    if (!staffModuleEnabled) {
      return NextResponse.json({ staff: [], moduleEnabled: false })
    }

    const baseWhere: Prisma.StaffWhereInput = {
      businessId: business.id,
      isActive: true,
      canAcceptBookings: true,
    }

    if (serviceId) {
      logger.info('Filtering staff for serviceId:', serviceId)
      baseWhere.serviceStaff = {
        some: {
          serviceId,
        },
      }
    }

    const staff = await prisma.staff.findMany({
      where: baseWhere,
      include: {
        workingHours: {
          where: { isActive: true },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })
    logger.info('Staff found:', staff.length)

    // Format response with only necessary public info
    const formattedStaff = staff.map((s) => ({
      id: s.id,
      name: s.name,
      photo: s.photo,
      bio: s.bio,
      specialties: s.specialties,
      rating: s.rating,
      totalReviews: s.totalReviews,
      workingHours: s.workingHours.map((wh) => ({
        dayOfWeek: wh.dayOfWeek,
        startTime: wh.startTime,
        endTime: wh.endTime,
      })),
    }))

    return NextResponse.json({
      staff: formattedStaff,
      moduleEnabled: true,
    })
  } catch (error) {
    logger.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}
