import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

// GET public business information by slug
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    
    // Get business by slug
    const business = await prisma.business.findFirst({
      where: { 
        slug: slug,
        isActive: true,
        isBlocked: false
      }
    })

    if (!business) {
      return NextResponse.json({ 
        error: 'Business not found',
        business: null 
      }, { status: 404 })
    }

    // Return public business information
    return NextResponse.json({
      id: business.id,
      name: business.name,
      email: business.email,
      phone: business.phone,
      address: business.address,
      city: business.city,
      state: business.state,
      postalCode: business.postalCode,
      website: business.website,
      description: business.description,
      settings: business.settings,
      features: business.features
    })
  } catch (error) {
    console.error('Error fetching business:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business information' },
      { status: 500 }
    )
  }
}