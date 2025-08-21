import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

// GET business information
export async function GET() {
  try {
    // Get default business
    const business = await prisma.business.findFirst({
      where: { slug: 'default-business' }
    })

    if (!business) {
      return NextResponse.json({ 
        error: 'Business not found',
        business: null 
      }, { status: 404 })
    }

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

// PUT update business information
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get default business
    const business = await prisma.business.findFirst({
      where: { slug: 'default-business' }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Update business information
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: {
        name: body.name || business.name,
        email: body.email || business.email,
        phone: body.phone || business.phone,
        address: body.address || business.address,
        city: body.city || business.city,
        state: body.state || business.state,
        postalCode: body.postalCode || business.postalCode,
        website: body.website,
        description: body.description,
        settings: body.settings || business.settings,
        features: body.features || business.features
      }
    })

    return NextResponse.json({ 
      success: true,
      business: {
        id: updatedBusiness.id,
        name: updatedBusiness.name,
        email: updatedBusiness.email,
        phone: updatedBusiness.phone,
        address: updatedBusiness.address,
        city: updatedBusiness.city,
        state: updatedBusiness.state,
        postalCode: updatedBusiness.postalCode,
        website: updatedBusiness.website,
        description: updatedBusiness.description,
        settings: updatedBusiness.settings,
        features: updatedBusiness.features
      }
    })
  } catch (error) {
    console.error('Error updating business:', error)
    return NextResponse.json(
      { error: 'Failed to update business information' },
      { status: 500 }
    )
  }
}