import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { fail, ok } from '@/lib/api-utils'
import { logger } from '@/lib/logger'

// GET all gallery items for the business (from gallery_items table)
export async function GET() {
  try {
    const business = await getCurrentBusiness()
    if (!business) return createAuthResponse('Business not found', 404)

    const items = await prisma.galleryItem.findMany({
      where: { businessId: business.id },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    })
    return NextResponse.json(items)
  } catch (error) {
    logger.error('Error fetching gallery:', error)
    return NextResponse.json([], { status: 200 })
  }
}

// POST create a new gallery item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const business = await getCurrentBusiness()
    if (!business) return createAuthResponse('Business not found', 404)

    // Compute next order
    const maxOrder = await prisma.galleryItem.findFirst({
      where: { businessId: business.id },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    // Basic validation
    const type = (body.type || 'image') as string
    if (!['image','video'].includes(type)) return fail('Invalid media type', 400)
    if (!body.url || !body.title) return fail('Title and URL are required', 400)

    const item = await prisma.galleryItem.create({
      data: {
        businessId: business.id,
        type,
        url: body.url,
        title: body.title,
        description: body.description || null,
        category: body.category || null,
        order: (maxOrder?.order || 0) + 1,
        isActive: true
      }
    })
    return ok(item)
  } catch (error) {
    logger.error('Error creating gallery item:', error)
    return NextResponse.json({ error: 'Failed to create gallery item' }, { status: 500 })
  }
}

// PUT update an existing gallery item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...update } = body
    if (!id) return fail('Item ID is required', 400)

    const business = await getCurrentBusiness()
    if (!business) return createAuthResponse('Business not found', 404)

    // Ensure the item belongs to the current business
    const existing = await prisma.galleryItem.findFirst({ where: { id, businessId: business.id } })
    if (!existing) return fail('Item not found', 404)

    const item = await prisma.galleryItem.update({
      where: { id },
      data: {
        type: update.type ?? existing.type,
        url: update.url ?? existing.url,
        title: update.title ?? existing.title,
        description: update.description ?? existing.description,
        category: update.category ?? existing.category,
        order: update.order ?? existing.order,
        isActive: update.isActive ?? existing.isActive
      }
    })
    return ok(item)
  } catch (error) {
    logger.error('Error updating gallery item:', error)
    return NextResponse.json({ error: 'Failed to update gallery item' }, { status: 500 })
  }
}

// DELETE a gallery item
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return fail('Item ID required', 400)

    const business = await getCurrentBusiness()
    if (!business) return createAuthResponse('Business not found', 404)

    // Ensure the item belongs to the current business
    const existing = await prisma.galleryItem.findFirst({ where: { id, businessId: business.id } })
    if (!existing) return fail('Item not found', 404)

    await prisma.galleryItem.delete({ where: { id } })
    return ok()
  } catch (error) {
    logger.error('Error deleting gallery item:', error)
    return fail('Failed to delete gallery item', 500)
  }
}
