import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { fail } from '@/lib/api-utils'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET all services for the business
export async function GET(request: NextRequest) {
  try {
    const business = await getCurrentBusiness()

    if (!business) return NextResponse.json([])

    const { searchParams } = new URL(request.url)
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const q = (searchParams.get('q') || '').trim()

    const page = pageParam ? parseInt(pageParam, 10) : NaN
    const pageSize = limitParam ? parseInt(limitParam, 10) : NaN

    const where: any = { businessId: business.id }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]
    }

    const include = {
      serviceStaff: { select: { staffId: true } }
    }

    // If pagination requested, return paged shape
    if (Number.isFinite(page) && Number.isFinite(pageSize) && page > 0 && pageSize > 0) {
      const total = await prisma.service.count({ where })
      const items = await prisma.service.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
      const formatted = items.map(s => ({ ...s, assignedStaff: s.serviceStaff.map(ss => ss.staffId) }))
      return NextResponse.json({ items: formatted, page, pageSize, total, totalPages: Math.ceil(total / pageSize) })
    }

    const services = await prisma.service.findMany({ where, include, orderBy: { createdAt: 'desc' } })
    
    // Format the response to include assignedStaff as an array of IDs
    const formattedServices = services.map(service => ({
      ...service,
      assignedStaff: service.serviceStaff.map(ss => ss.staffId)
    }))

    return NextResponse.json(formattedServices)
  } catch (error) {
    logger.error('Error fetching services:', error)
    return createAuthResponse('Failed to fetch services', 500)
  }
}

// POST create service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // Basic validation
    const name = (body.name || '').toString().trim()
    if (!name) return fail('Service name is required', 400)
    const duration = parseInt(body.duration)
    if (!Number.isFinite(duration) || duration <= 0) return fail('Duration must be a positive integer', 400)
    const price = parseFloat(body.price)
    if (!Number.isFinite(price) || price < 0) return fail('Price must be a non-negative number', 400)
    const category = body.category ? (body.category as string).toString().trim() : null

    // Enforce unique name per business (case-insensitive)
    const existingByName = await prisma.service.findFirst({
      where: { businessId: business.id, name: { equals: name, mode: 'insensitive' } },
      select: { id: true }
    })
    if (existingByName) return fail('A service with this name already exists', 409)

    // Create the service
    const service = await prisma.service.create({
      data: {
        name,
        description: body.description,
        duration,
        price,
        category,
        businessId: business.id,
        tenantId: business.tenantId,
        isActive: body.isActive !== undefined ? body.isActive : true,
        allowOnline: body.allowOnline !== undefined ? body.allowOnline : true,
        allowHomeService: body.allowHomeService !== undefined ? body.allowHomeService : false
      }
    })
    
    // If staff are assigned, create the relationships
    if (body.assignedStaff && body.assignedStaff.length > 0) {
      await prisma.serviceStaff.createMany({
        data: body.assignedStaff.map((staffId: string) => ({
          serviceId: service.id,
          staffId: staffId
        }))
      })
    }

    return NextResponse.json(service)
  } catch (error: any) {
    logger.error('Error creating service:', error)
    if (error?.code === 'P2002') {
      return fail('A service with this name already exists', 409)
    }
    return fail('Failed to create service', 500)
  }
}

// PUT update service
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, assignedStaff, ...updateData } = body

    if (!id) return fail('Service ID is required', 400)

    const business = await getCurrentBusiness()

    if (!business) return createAuthResponse('Business not found', 404)

    // Verify the service belongs to this business
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        businessId: business.id
      }
    })

    if (!existingService) return fail('Service not found', 404)

    // Validate incoming core fields if present
    const data: any = { ...updateData }
    if (data.name !== undefined) {
      data.name = (data.name || '').toString().trim()
      if (!data.name) return fail('Service name is required', 400)
    }
    if (data.duration !== undefined) {
      const d = parseInt(data.duration)
      if (!Number.isFinite(d) || d <= 0) return fail('Duration must be a positive integer', 400)
      data.duration = d
    }
    if (data.price !== undefined) {
      const p = parseFloat(data.price)
      if (!Number.isFinite(p) || p < 0) return fail('Price must be a non-negative number', 400)
      data.price = p
    }
    if (data.category !== undefined) {
      data.category = data.category ? (data.category as string).toString().trim() : null
    }

    // If name changes, ensure uniqueness per business
    if (data.name) {
      const dup = await prisma.service.findFirst({
        where: { businessId: business.id, name: { equals: data.name, mode: 'insensitive' }, NOT: { id } },
        select: { id: true }
      })
      if (dup) return fail('A service with this name already exists', 409)
    }

    const service = await prisma.service.update({
      where: { id },
      data
    })
    
    // Update staff assignments if provided
    if (assignedStaff !== undefined) {
      // Delete existing assignments
      await prisma.serviceStaff.deleteMany({
        where: { serviceId: id }
      })
      
      // Create new assignments
      if (assignedStaff.length > 0) {
        await prisma.serviceStaff.createMany({
          data: assignedStaff.map((staffId: string) => ({
            serviceId: id,
            staffId: staffId
          }))
        })
      }
    }

    return NextResponse.json(service)
  } catch (error: any) {
    logger.error('Error updating service:', error)
    if (error?.code === 'P2002') {
      return fail('A service with this name already exists', 409)
    }
    return fail('Failed to update service', 500)
  }
}

// DELETE service
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return fail('Service ID is required', 400)

    const business = await getCurrentBusiness()

    if (!business) return createAuthResponse('Business not found', 404)

    // Verify the service belongs to this business
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        businessId: business.id
      }
    })

    if (!existingService) return fail('Service not found', 404)

    // Delete related ServiceStaff records first
    await prisma.serviceStaff.deleteMany({
      where: { serviceId: id }
    })
    
    // Delete the service
    await prisma.service.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting service:', error)
    return fail('Failed to delete service', 500)
  }
}
