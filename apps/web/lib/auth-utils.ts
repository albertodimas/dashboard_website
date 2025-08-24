import { cookies } from 'next/headers'
import { prisma } from '@dashboard/db'
import { NextResponse } from 'next/server'

export async function getCurrentUser() {
  const sessionCookie = cookies().get('session')
  
  if (!sessionCookie) {
    return null
  }

  try {
    // Decode session
    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

    // Get user with tenant info
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        language: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            subdomain: true
          }
        }
      }
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function getCurrentBusiness() {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  // Get or create business for this tenant
  let business = await prisma.business.findFirst({
    where: { tenantId: user.tenantId }
  })

  // If no business exists for this tenant, create one
  if (!business) {
    const tenantInfo = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { name: true, subdomain: true }
    })

    business = await prisma.business.create({
      data: {
        tenantId: user.tenantId,
        name: tenantInfo?.name || user.name + "'s Business",
        slug: tenantInfo?.subdomain || `business-${user.tenantId}`,
        email: user.email,
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
        timezone: 'America/New_York', // Default timezone
        currency: 'USD', // Default currency
        settings: {
          scheduleSettings: {
            timeInterval: 30,
            startTime: null, // Must be configured
            endTime: null, // Must be configured
            workingDays: [] // Must be configured by business owner
          },
          needsConfiguration: true, // Flag to show configuration reminder
          theme: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1F2937', 
            accentColor: '#10B981',
            backgroundColor: '#FFFFFF'
          }
        },
        features: {
          gallery: []
        }
      }
    })

    // Create a default staff member for the business owner
    await prisma.staff.create({
      data: {
        businessId: business.id,
        name: user.name || 'Business Owner',
        email: user.email,
        phone: '',
        isActive: true,
        canAcceptBookings: true
      }
    })
  }

  return business
}

export function createAuthResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}