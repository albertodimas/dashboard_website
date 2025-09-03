import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const businessId = searchParams.get('businessId')

    if (!email || !businessId) {
      return NextResponse.json(
        { error: 'Email and businessId are required' },
        { status: 400 }
      )
    }

    // Find customer by email AND businessId to ensure tenant isolation
    const customer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase(),
        businessId: businessId
      }
    })

    if (!customer) {
      return NextResponse.json({ 
        success: true, 
        packages: [] 
      })
    }

    // Get active package purchases for this customer and business
    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId: customer.id,
        businessId: businessId,
        status: 'ACTIVE',
        remainingSessions: { gt: 0 },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } }
        ]
      },
      include: {
        package: {
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      },
      orderBy: {
        remainingSessions: 'desc'
      }
    })

    return NextResponse.json({ 
      success: true, 
      packages,
      customer: {
        name: customer.name,
        phone: customer.phone
      }
    })

  } catch (error) {
    console.error('Error fetching customer packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer packages' },
      { status: 500 }
    )
  }
}