import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@dashboard/db'
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

    const body = await request.json()
    const { purchaseId, notes } = body

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      )
    }

    // Get the purchase details
    const purchase = await prisma.packagePurchase.findUnique({
      where: { id: purchaseId },
      include: {
        package: true,
        customer: true
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Check if purchase is pending
    if (purchase.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Purchase is not pending activation' },
        { status: 400 }
      )
    }

    // Calculate expiry date from today if validity days are set
    let expiryDate: Date | null = null
    if (purchase.package.validityDays) {
      expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + purchase.package.validityDays)
    }

    // Activate the purchase
    const updatedPurchase = await prisma.packagePurchase.update({
      where: { id: purchaseId },
      data: {
        status: 'ACTIVE',
        paymentStatus: 'PAID',
        expiryDate,
        notes: notes ? `${purchase.notes || ''}\n\nActivation notes: ${notes}` : purchase.notes,
        updatedAt: new Date()
      },
      include: {
        package: true,
        customer: true
      }
    })

    // TODO: Send email notification to customer about activation
    // This would be implemented when email service is configured

    return NextResponse.json({ 
      success: true,
      message: 'Package activated successfully',
      purchase: updatedPurchase
    })

  } catch (error) {
    logger.error('Error activating package purchase:', error)
    return NextResponse.json(
      { error: 'Failed to activate package purchase' },
      { status: 500 }
    )
  }
}