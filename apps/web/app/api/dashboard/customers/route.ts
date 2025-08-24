import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'

// GET all customers
export async function GET() {
  try {
    // Get current business
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: business.tenantId
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format customers to match frontend structure
    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      totalVisits: 0, // Will be calculated from appointments
      totalSpent: 0, // Will be calculated from appointments
      lastVisit: customer.updatedAt.toISOString().split('T')[0],
      status: customer.isVip ? 'active' : 'active'
    }))

    return NextResponse.json(formattedCustomers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST create customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get current business
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId: business.tenantId,
        email: body.email,
        name: body.name,
        phone: body.phone,
        isVip: false
      }
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}

// PUT update customer
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.update({
      where: { id: body.id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone
      }
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE customer
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    await prisma.customer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}