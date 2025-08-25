import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentUser, getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { getRecommendedModules } from '@/lib/business-types'

export async function GET(req: NextRequest) {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    return NextResponse.json({
      businessType: business.businessType,
      features: business.features || {}
    })
  } catch (error) {
    console.error('Error fetching business modules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business modules' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return createAuthResponse('Unauthorized', 401)
    }

    const { businessType, features } = await req.json()

    // Update the business with new type and features
    const business = await prisma.business.updateMany({
      where: { tenantId: user.tenantId },
      data: {
        businessType,
        features: features || {}
      }
    })

    if (business.count === 0) {
      return createAuthResponse('Business not found', 404)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Modules updated successfully',
      businessType,
      features
    })
  } catch (error) {
    console.error('Error saving business modules:', error)
    return NextResponse.json(
      { error: 'Failed to save business modules' },
      { status: 500 }
    )
  }
}