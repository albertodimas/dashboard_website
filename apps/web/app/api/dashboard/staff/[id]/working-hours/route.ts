import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { z } from 'zod'

const workingHourSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  isActive: z.boolean().optional()
})

// GET working hours for a specific staff member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // Verify staff belongs to this business
    const staff = await prisma.staff.findFirst({
      where: {
        id: params.id,
        businessId: business.id
      }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    const workingHours = await prisma.workingHour.findMany({
      where: { 
        staffId: params.id,
        businessId: business.id
      },
      orderBy: { dayOfWeek: 'asc' }
    })

    return NextResponse.json(workingHours)
  } catch (error) {
    console.error('Error fetching working hours:', error)
    return NextResponse.json(
      { error: 'Failed to fetch working hours' },
      { status: 500 }
    )
  }
}

// POST create or update working hours for a staff member
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // Verify staff belongs to this business
    const staff = await prisma.staff.findFirst({
      where: {
        id: params.id,
        businessId: business.id
      }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = workingHourSchema.parse(body)

    // Check if working hour already exists for this day
    const existing = await prisma.workingHour.findUnique({
      where: {
        businessId_staffId_dayOfWeek: {
          businessId: business.id,
          staffId: params.id,
          dayOfWeek: validated.dayOfWeek
        }
      }
    })

    let workingHour
    if (existing) {
      // Update existing
      workingHour = await prisma.workingHour.update({
        where: { id: existing.id },
        data: {
          startTime: validated.startTime,
          endTime: validated.endTime,
          isActive: validated.isActive !== false
        }
      })
    } else {
      // Create new
      workingHour = await prisma.workingHour.create({
        data: {
          businessId: business.id,
          staffId: params.id,
          dayOfWeek: validated.dayOfWeek,
          startTime: validated.startTime,
          endTime: validated.endTime,
          isActive: validated.isActive !== false
        }
      })
    }

    return NextResponse.json(workingHour)
  } catch (error) {
    console.error('Error saving working hours:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to save working hours' },
      { status: 500 }
    )
  }
}

// DELETE remove working hours for a specific day
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const { searchParams } = new URL(request.url)
    const dayOfWeek = searchParams.get('dayOfWeek')

    if (!dayOfWeek) {
      return NextResponse.json(
        { error: 'Day of week is required' },
        { status: 400 }
      )
    }

    // Verify staff belongs to this business
    const staff = await prisma.staff.findFirst({
      where: {
        id: params.id,
        businessId: business.id
      }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    await prisma.workingHour.deleteMany({
      where: {
        businessId: business.id,
        staffId: params.id,
        dayOfWeek: parseInt(dayOfWeek)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting working hours:', error)
    return NextResponse.json(
      { error: 'Failed to delete working hours' },
      { status: 500 }
    )
  }
}