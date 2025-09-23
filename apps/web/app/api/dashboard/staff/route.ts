import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { z } from 'zod'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  photo: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  canAcceptBookings: z.boolean().optional(),
  displayOrder: z.number().optional()
})

// GET all staff members for the business
export async function GET() {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const staff = await prisma.staff.findMany({
      where: { businessId: business.id },
      include: {
        workingHours: true,
        _count: {
          select: {
            appointments: true,
            staffReviews: true
          }
        }
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }]
    })

    return NextResponse.json(staff)
  } catch (error) {
    logger.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

// POST create new staff member
export async function POST(request: NextRequest) {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const body = await request.json()
    const validated = staffSchema.parse(body)

    // Get max display order
    const maxOrder = await prisma.staff.findFirst({
      where: { businessId: business.id },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })

    const staff = await prisma.staff.create({
      data: {
        businessId: business.id,
        name: validated.name,
        email: validated.email,
        phone: validated.phone || '',
        photo: validated.photo,
        bio: validated.bio,
        specialties: validated.specialties || [],
        isActive: validated.isActive !== false,
        canAcceptBookings: validated.canAcceptBookings !== false,
        displayOrder: validated.displayOrder ?? ((maxOrder?.displayOrder ?? 0) + 1)
      },
      include: {
        workingHours: true
      }
    })

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    logger.error('Error creating staff:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    )
  }
}

// PUT update staff member
export async function PUT(request: NextRequest) {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    // Verify staff belongs to this business
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        businessId: business.id
      }
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    const validated = staffSchema.partial().parse(data)

    const staff = await prisma.staff.update({
      where: { id },
      data: validated
    })

    return NextResponse.json(staff)
  } catch (error) {
    logger.error('Error updating staff:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

// DELETE staff member
export async function DELETE(request: NextRequest) {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    // Verify staff belongs to this business
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        businessId: business.id
      }
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Check if this is the only staff member
    const staffCount = await prisma.staff.count({
      where: { businessId: business.id }
    })

    if (staffCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only staff member' },
        { status: 400 }
      )
    }

    await prisma.staff.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting staff:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    )
  }
}