import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentUser, getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'

// GET business information
export async function GET() {
  try {
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    return NextResponse.json({
      id: business.id,
      name: business.name,
      slug: business.slug,
      customSlug: business.customSlug,
      email: business.email,
      phone: business.phone,
      address: business.address,
      city: business.city,
      state: business.state,
      postalCode: business.postalCode,
      country: business.country,
      website: business.website,
      description: business.description,
      settings: business.settings,
      features: business.features,
      enableStaffModule: business.enableStaffModule
    })
  } catch (error) {
    console.error('Error fetching business:', error)
    return createAuthResponse('Failed to fetch business information', 500)
  }
}

// PUT update business information
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
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
        country: body.country || business.country,
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
        country: updatedBusiness.country,
        website: updatedBusiness.website,
        description: updatedBusiness.description,
        settings: updatedBusiness.settings,
        features: updatedBusiness.features,
        enableStaffModule: updatedBusiness.enableStaffModule
      }
    })
  } catch (error) {
    console.error('Error updating business:', error)
    return createAuthResponse('Failed to update business information', 500)
  }
}

// PATCH update specific business fields (including customSlug)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // If customSlug is being updated, check for uniqueness
    if (body.customSlug !== undefined) {
      if (body.customSlug) {
        const existingBusiness = await prisma.business.findFirst({
          where: {
            customSlug: body.customSlug,
            NOT: { id: business.id }
          }
        })

        if (existingBusiness) {
          return NextResponse.json({ 
            error: 'This URL is already taken by another business',
            message: 'Unique constraint: This URL is already taken'
          }, { status: 400 })
        }
      }
    }

    // Update the business
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: {
        ...(body.customSlug !== undefined && { customSlug: body.customSlug || null }),
        ...(body.websiteUrl !== undefined && { website: body.websiteUrl }),
        ...((body.customDomain !== undefined || body.theme !== undefined) && { 
          settings: {
            ...(business.settings as any || {}),
            ...(body.customDomain !== undefined && { customDomain: body.customDomain }),
            ...(body.theme !== undefined && { theme: body.theme })
          }
        })
      }
    })

    return NextResponse.json({
      id: updatedBusiness.id,
      name: updatedBusiness.name,
      slug: updatedBusiness.slug,
      customSlug: updatedBusiness.customSlug,
      email: updatedBusiness.email,
      phone: updatedBusiness.phone,
      address: updatedBusiness.address,
      city: updatedBusiness.city,
      state: updatedBusiness.state,
      postalCode: updatedBusiness.postalCode,
      country: updatedBusiness.country,
      website: updatedBusiness.website,
      description: updatedBusiness.description,
      settings: updatedBusiness.settings,
      features: updatedBusiness.features,
      enableStaffModule: updatedBusiness.enableStaffModule
    })
  } catch (error) {
    console.error('Error updating business customSlug:', error)
    return createAuthResponse('Failed to update business settings', 500)
  }
}