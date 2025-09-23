import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const staffId = params.id
    const scheduleData = await request.json()
    
    logger.info('Received schedule data:', scheduleData)
    logger.info('Staff ID:', staffId)
    logger.info('Business ID:', business.id)

    // Verify the staff member belongs to the user's business
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        businessId: business.id
      }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Delete existing working hours for this staff member
    await prisma.workingHour.deleteMany({
      where: {
        staffId: staffId,
        businessId: business.id
      }
    })

    // Create new working hours
    const workingHours: Array<{
      businessId: string
      staffId: string
      dayOfWeek: number
      startTime: string
      endTime: string
      isActive: boolean
    }> = []
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      const dayData = scheduleData[dayOfWeek]
      if (dayData && dayData.isActive) {
        workingHours.push({
          businessId: business.id,
          staffId: staffId,
          dayOfWeek,
          startTime: dayData.startTime,
          endTime: dayData.endTime,
          isActive: true
        })
      }
    }

    if (workingHours.length > 0) {
      await prisma.workingHour.createMany({
        data: workingHours
      })
    }

    // Fetch updated staff with working hours
    const updatedStaff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        workingHours: {
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      staff: updatedStaff,
      message: 'Working hours updated successfully'
    })
  } catch (error) {
    logger.error('Error updating working hours:', error)
    return NextResponse.json(
      { error: 'Failed to update working hours' },
      { status: 500 }
    )
  }
}

// GET working hours for a staff member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const staffId = params.id

    // Verify the staff member belongs to the user's business
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        businessId: business.id
      },
      include: {
        workingHours: {
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Format working hours for the frontend
    const formattedSchedule: any = {}
    for (let day = 0; day <= 6; day++) {
      const dayHours = staff.workingHours.find(wh => wh.dayOfWeek === day)
      formattedSchedule[day] = dayHours ? {
        isActive: dayHours.isActive,
        startTime: dayHours.startTime,
        endTime: dayHours.endTime
      } : {
        isActive: false,
        startTime: '09:00',
        endTime: '17:00'
      }
    }

    return NextResponse.json({
      success: true,
      schedule: formattedSchedule,
      staff
    })
  } catch (error) {
    logger.error('Error fetching working hours:', error)
    return NextResponse.json(
      { error: 'Failed to fetch working hours' },
      { status: 500 }
    )
  }
}