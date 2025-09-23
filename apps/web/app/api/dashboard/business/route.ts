import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { getCurrentUser, getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Lista de rutas reservadas del sistema que no pueden ser usadas como slugs
const RESERVED_ROUTES = [
  'login',
  'register',
  'dashboard',
  'api',
  'admin',
  'auth',
  'business',
  'settings',
  'profile',
  'logout',
  'signup',
  'signin',
  'forgot-password',
  'reset-password',
  'verify',
  'confirm',
  'public',
  'static',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'cliente',
  'client',
  'book',
  'directory',
  'assets',
  'images',
  'css',
  'js',
  'fonts'
]

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
      businessType: business.businessType,
      categoryId: business.categoryId,
      email: business.email,
      phone: business.phone,
      address: business.address,
      city: business.city,
      state: business.state,
      postalCode: business.postalCode,
      country: business.country,
      website: business.website,
      description: business.description,
      logo: business.logo,
      coverImage: business.coverImage,
      settings: business.settings,
      features: business.features,
      enableStaffModule: business.enableStaffModule,
      enablePackagesModule: business.enablePackagesModule
    })
  } catch (error) {
    logger.error('Error fetching business:', error)
    return createAuthResponse('Failed to fetch business information', 500)
  }
}

// PUT update business information
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    logger.info('Received PUT request body:', JSON.stringify(body, null, 2))
    
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // Generate new customSlug if name changed
    let customSlug = business.customSlug
    if (body.name && body.name !== business.name) {
      // Generate slug from new name
      const baseSlug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      // Check if slug is available and not reserved
      let slug = baseSlug
      let counter = 1
      while (true) {
        // Check if it's a reserved route
        if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
          slug = `${baseSlug}${counter}`
          counter++
          continue
        }
        
        // Check if another business is using this slug
        const existing = await prisma.business.findFirst({
          where: {
            customSlug: slug,
            NOT: { id: business.id }
          }
        })
        if (!existing) {
          customSlug = slug
          break
        }
        slug = `${baseSlug}${counter}`
        counter++
      }
    }

    // Update business information
    // Merge settings (preserve existing + allow updating operationMode and others)
    const currentSettings: any = (business.settings as any) || {}
    let mergedSettings: any = { ...currentSettings }
    if (body.customDomain !== undefined) mergedSettings.customDomain = body.customDomain
    if (body.theme !== undefined) mergedSettings.theme = body.theme
    if (body.ui !== undefined) mergedSettings.ui = body.ui
    // If caller provided a settings object, merge it on top of current settings
    if (body.settings && typeof body.settings === 'object') {
      mergedSettings = {
        ...currentSettings,
        ...body.settings,
        // Ensure nested objects like theme/ui are not lost if omitted in body.settings
        ...(currentSettings.theme && !('theme' in body.settings) ? { theme: currentSettings.theme } : {}),
        ...(currentSettings.ui && !('ui' in body.settings) ? { ui: currentSettings.ui } : {})
      }
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: {
        name: body.name || business.name,
        businessType: body.businessType || business.businessType,
        // businessCategory is managed from admin panel, not from settings
        // categoryId is managed from admin panel, not from settings
        email: body.email || business.email,
        phone: body.phone || business.phone,
        address: body.address || business.address,
        city: body.city !== undefined ? (body.city || 'Not specified') : business.city,
        state: body.state !== undefined ? (body.state || 'Not specified') : business.state,
        postalCode: body.postalCode || business.postalCode,
        country: body.country || business.country,
        website: body.website,
        description: body.description,
        logo: body.logo !== undefined ? body.logo : business.logo,
        coverImage: body.coverImage !== undefined ? body.coverImage : business.coverImage,
        customSlug: customSlug,
        settings: Object.keys(mergedSettings).length ? mergedSettings : (body.settings || business.settings),
        features: body.features || business.features
      }
    })

    return NextResponse.json({ 
      success: true,
      business: {
        id: updatedBusiness.id,
        name: updatedBusiness.name,
        slug: updatedBusiness.slug,
        customSlug: updatedBusiness.customSlug,
        businessType: updatedBusiness.businessType,
        categoryId: updatedBusiness.categoryId,
        email: updatedBusiness.email,
        phone: updatedBusiness.phone,
        address: updatedBusiness.address,
        city: updatedBusiness.city,
        state: updatedBusiness.state,
        postalCode: updatedBusiness.postalCode,
        country: updatedBusiness.country,
        website: updatedBusiness.website,
        description: updatedBusiness.description,
        logo: updatedBusiness.logo,
        coverImage: updatedBusiness.coverImage,
        settings: updatedBusiness.settings,
        features: updatedBusiness.features,
        enableStaffModule: updatedBusiness.enableStaffModule,
        enablePackagesModule: updatedBusiness.enablePackagesModule
      }
    })
  } catch (error) {
    logger.error('Error updating business:', error)
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

    // If customSlug is being updated, check for uniqueness and reserved routes
    if (body.customSlug !== undefined) {
      if (body.customSlug) {
        // Check if it's a reserved route
        if (RESERVED_ROUTES.includes(body.customSlug.toLowerCase())) {
          return NextResponse.json({ 
            error: 'This URL is reserved and cannot be used',
            message: `The URL "${body.customSlug}" is a system reserved route. Please choose a different URL.`
          }, { status: 400 })
        }
        
        // Check if another business is using this slug
        const existingBusiness = await prisma.business.findFirst({
          where: {
            customSlug: body.customSlug,
            NOT: { id: business.id }
          }
        })

        if (existingBusiness) {
          return NextResponse.json({ 
            error: 'This URL is already taken by another business',
            message: 'This URL is already in use. Please choose a different URL.'
          }, { status: 400 })
        }
      }
    }

    // Prepare merged settings (theme, ui, customDomain)
    const existingSettings: any = (business.settings as any) || {}
    const shouldUpdateSettings = (
      body.customDomain !== undefined ||
      body.theme !== undefined ||
      body.ui !== undefined
    )

    const mergedSettings = shouldUpdateSettings
      ? {
          ...existingSettings,
          ...(body.customDomain !== undefined && { customDomain: body.customDomain }),
          ...(body.theme !== undefined && { theme: body.theme }),
          ...(body.ui !== undefined && { ui: { ...(existingSettings.ui || {}), ...(body.ui || {}) } })
        }
      : existingSettings

    // Update the business
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: {
        ...(body.customSlug !== undefined && { customSlug: body.customSlug || null }),
        ...(body.websiteUrl !== undefined && { website: body.websiteUrl }),
        ...(shouldUpdateSettings && { settings: mergedSettings })
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
    logger.error('Error updating business customSlug:', error)
    return createAuthResponse('Failed to update business settings', 500)
  }
}
