import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@dashboard/db'

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

    const body = await request.json()
    const { packageId, customerId, paymentMethod = 'CASH' } = body

    // Get package details
    const packageDetails = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        business: true
      }
    })

    if (!packageDetails) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Check if customer already has an active purchase for this package
    const existingPurchase = await prisma.packagePurchase.findFirst({
      where: {
        packageId,
        customerId,
        status: 'ACTIVE',
        remainingSessions: { gt: 0 }
      }
    })

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'Customer already has an active purchase for this package' },
        { status: 400 }
      )
    }

    // Calculate expiry date if validity days are set
    let expiryDate = null
    if (packageDetails.validityDays) {
      expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + packageDetails.validityDays)
    }

    // Create the package purchase
    const purchase = await prisma.packagePurchase.create({
      data: {
        tenantId: packageDetails.tenantId,
        businessId: packageDetails.businessId,
        packageId,
        customerId,
        purchaseDate: new Date(),
        expiryDate,
        totalSessions: packageDetails.sessionCount || 1,
        usedSessions: 0,
        remainingSessions: packageDetails.sessionCount || 1,
        pricePaid: packageDetails.price,
        paymentMethod,
        paymentStatus: 'COMPLETED',
        status: 'ACTIVE'
      },
      include: {
        package: true,
        customer: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      purchase 
    })

  } catch (error) {
    console.error('Error creating package purchase:', error)
    return NextResponse.json(
      { error: 'Failed to create package purchase' },
      { status: 500 }
    )
  }
}

// Get purchases for a customer
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const businessId = searchParams.get('businessId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = {
      customerId,
      status: 'ACTIVE'
    }

    if (businessId) {
      whereClause.businessId = businessId
    }

    const purchases = await prisma.packagePurchase.findMany({
      where: whereClause,
      include: {
        package: {
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        },
        sessionUsages: {
          include: {
            appointment: true
          }
        }
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    })

    // Filter out expired purchases
    const activePurchases = purchases.filter(p => {
      if (!p.expiryDate) return true
      return new Date(p.expiryDate) > new Date()
    })

    return NextResponse.json({ 
      success: true, 
      purchases: activePurchases 
    })

  } catch (error) {
    console.error('Error fetching package purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch package purchases' },
      { status: 500 }
    )
  }
}