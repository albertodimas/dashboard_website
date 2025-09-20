import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma, PackagePaymentStatus, PurchaseStatus } from '@dashboard/db'
import { z } from 'zod'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

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

    const bodySchema = z.object({
      packageId: z.string().uuid(),
      customerId: z.string().uuid(),
      paymentMethod: z.enum(['CASH', 'TRANSFER']).optional().default('CASH'),
      paymentStatus: z.nativeEnum(PackagePaymentStatus).optional().default(PackagePaymentStatus.PENDING),
      status: z.nativeEnum(PurchaseStatus).optional().default(PurchaseStatus.PENDING),
    })
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { packageId, customerId, paymentMethod, paymentStatus, status } = parsed.data

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

    // Only check for existing active purchases if we're creating an active one
    if (status === PurchaseStatus.ACTIVE) {
      const existingPurchase = await prisma.packagePurchase.findFirst({
        where: {
          packageId,
          customerId,
          status: PurchaseStatus.ACTIVE,
          remainingSessions: { gt: 0 }
        }
      })

      if (existingPurchase) {
        return NextResponse.json(
          { error: 'Customer already has an active purchase for this package' },
          { status: 400 }
        )
      }
    }

    // Calculate expiry date if validity days are set and package is active
    let expiryDate = null
    if (packageDetails.validityDays && status === PurchaseStatus.ACTIVE) {
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
        paymentStatus,
        status
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
    logger.error('Error creating package purchase:', error)
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

    const searchSchema = z.object({ customerId: z.string().uuid(), businessId: z.string().uuid().optional() })
    const sp = Object.fromEntries(new URL(request.url).searchParams)
    const parsed = searchSchema.safeParse(sp)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 })
    }
    const { customerId, businessId } = parsed.data

    const whereClause = {
      customerId,
      status: PurchaseStatus.ACTIVE,
      ...(businessId ? { businessId } : {}),
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
    logger.error('Error fetching package purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch package purchases' },
      { status: 500 }
    )
  }
}
