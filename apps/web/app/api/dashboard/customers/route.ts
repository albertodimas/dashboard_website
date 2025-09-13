import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { fail } from '@/lib/api-utils'

// GET all customers
export async function GET(request: NextRequest) {
  try {
    // Get current business
    const business = await getCurrentBusiness()

    if (!business) return createAuthResponse('Business not found', 404)

    const { searchParams } = new URL(request.url)
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const q = (searchParams.get('q') || '').trim()

    const page = pageParam ? parseInt(pageParam, 10) : NaN
    const pageSize = limitParam ? parseInt(limitParam, 10) : NaN

    const where: any = { tenantId: business.tenantId }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } }
      ]
    }

    const projector = (customer: any) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      totalVisits: 0,
      totalSpent: 0,
      lastVisit: customer.updatedAt.toISOString().split('T')[0],
      status: customer.isVip ? 'active' : 'active'
    })

    if (Number.isFinite(page) && Number.isFinite(pageSize) && page > 0 && pageSize > 0) {
      const total = await prisma.customer.count({ where })
      const items = await prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize })
      return NextResponse.json({ items: items.map(projector), page, pageSize, total, totalPages: Math.ceil(total / pageSize) })
    }

    const customers = await prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(customers.map(projector))
  } catch (error) {
    console.error('Error fetching customers:', error)
    return fail('Failed to fetch customers', 500)
  }
}

// POST create customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get current business
    const business = await getCurrentBusiness()

    if (!business) return createAuthResponse('Business not found', 404)

    // Validation
    const name = (body.name || '').toString().trim()
    if (!name) return fail('Name is required', 400)
    const email = (body.email || '').toString().trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('A valid email is required', 400)
    const phone = body.phone ? (body.phone as string).toString().trim() : null

    try {
      const customer = await prisma.customer.create({
        data: {
          tenantId: business.tenantId,
          email,
          name,
          phone: phone || undefined,
          isVip: false
        }
      })
      return NextResponse.json({ customer })
    } catch (e: any) {
      // Unique email constraint might trigger
      return fail('Failed to create customer', 500)
    }
  } catch (error) {
    console.error('Error creating customer:', error)
    return fail('Failed to create customer', 500)
  }
}

// PUT update customer
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) return fail('Customer ID is required', 400)

    const name = (body.name || '').toString().trim()
    if (!name) return fail('Name is required', 400)
    const email = (body.email || '').toString().trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('A valid email is required', 400)
    const phone = body.phone ? (body.phone as string).toString().trim() : null

    const customer = await prisma.customer.update({
      where: { id: body.id },
      data: { name, email, phone: phone || undefined }
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error updating customer:', error)
    return fail('Failed to update customer', 500)
  }
}

// DELETE customer
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) return fail('Customer ID is required', 400)

    await prisma.customer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return fail('Failed to delete customer', 500)
  }
}
