import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { trackError } from '@/lib/observability'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({
      packageId: z.string().uuid(),
      customerName: z.string().min(2),
      customerEmail: z.string().email(),
      customerPhone: z.string().min(7).optional(),
      paymentMethod: z.enum(['CASH', 'TRANSFER']).optional().default('TRANSFER'),
      notes: z.string().optional(),
    })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { packageId, customerName, customerEmail, customerPhone, paymentMethod, notes } = parsed.data

    // Rate limit by IP: 5 reserves / 10 minutes
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'public:packages:reserve', 5, 60 * 10)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 600) } }
      )
    }

    // Get package details
    const packageDetails = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        business: true
      }
    })

    if (!packageDetails || !packageDetails.isActive) {
      return NextResponse.json(
        { error: 'Package not found or not available' },
        { status: 404 }
      )
    }

    // Check if customer exists or create new
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: packageDetails.tenantId,
        email: customerEmail.toLowerCase()
      }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: packageDetails.tenantId,
          email: customerEmail.toLowerCase(),
          name: customerName,
          phone: customerPhone || ''
        }
      })
    } else if (customerPhone && !customer.phone) {
      // Update phone if provided and not existing
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { phone: customerPhone }
      })
    }

    // Note: Customers can purchase the same package multiple times
    // This allows for repeat purchases and package renewals

    // Calculate expiry date if validity days are set (but it will start from activation date)
    let expiryDate = null
    if (packageDetails.validityDays) {
      // This will be recalculated when the package is activated
      expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + packageDetails.validityDays)
    }

    // Create the package purchase with PENDING status
    const purchase = await prisma.packagePurchase.create({
      data: {
        tenantId: packageDetails.tenantId,
        businessId: packageDetails.businessId,
        packageId,
        customerId: customer.id,
        purchaseDate: new Date(),
        expiryDate: null, // Will be set when activated
        totalSessions: packageDetails.sessionCount || 1,
        usedSessions: 0,
        remainingSessions: packageDetails.sessionCount || 1,
        pricePaid: packageDetails.price,
        paymentMethod,
        paymentStatus: 'PENDING',
        status: 'PENDING', // Initially pending until owner confirms payment
        notes: notes ? `Customer notes: ${notes}` : 'Pending payment confirmation'
      },
      include: {
        package: true,
        customer: true
      }
    })

    // Send email notification to business owner (if email service is configured)
    // TODO: Implement email notification

    return NextResponse.json({ 
      success: true,
      message: 'Package reservation successful. Please proceed with payment and wait for confirmation.',
      purchase: {
        id: purchase.id,
        packageName: purchase.package.name,
        totalSessions: purchase.totalSessions,
        price: purchase.pricePaid,
        status: purchase.status,
        paymentInstructions: getPaymentInstructions(packageDetails.business, paymentMethod)
      }
    })

  } catch (error) {
    trackError(error, { route: 'public/packages/reserve' })
    return NextResponse.json({ error: 'Failed to reserve package. Please try again.' }, { status: 500 })
  }
}

// Helper function to provide payment instructions
function getPaymentInstructions(business: any, paymentMethod: string) {
  const instructions: any = {
    businessName: business.name,
    paymentMethod
  }

  // Add business-specific payment details if available in settings
  if (business.settings) {
    const settings = typeof business.settings === 'string' 
      ? JSON.parse(business.settings) 
      : business.settings

    if (settings.paymentDetails) {
      instructions.details = settings.paymentDetails[paymentMethod] || null
    }
  }

  // Default instructions
  if (paymentMethod === 'TRANSFER') {
    instructions.message = 'Please make the bank transfer and send proof of payment via WhatsApp or email.'
  } else if (paymentMethod === 'CASH') {
    instructions.message = 'Please pay in person at our location.'
  } else {
    instructions.message = 'Please complete the payment as agreed and wait for confirmation.'
  }

  return instructions
}
