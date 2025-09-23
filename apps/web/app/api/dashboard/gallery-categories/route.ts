import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { ok, fail } from '@/lib/api-utils'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET all gallery categories for the business
export async function GET() {
  try {
    const business = await getCurrentBusiness()
    if (!business) return createAuthResponse('Business not found', 404)

    // Prefer relational table if available and non-empty
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        'SELECT id, name, "order" FROM public.business_gallery_categories WHERE "businessId" = $1 ORDER BY "order" ASC',
        business.id
      )
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json(rows.map(r => ({ id: r.id, name: r.name, order: Number(r.order) || 0 })))
      }
    } catch (e) {
      // Table may not exist; fallback to JSON
    }

    const settings = (business.settings as any) || {}
    const categories = settings.galleryCategories || []
    return NextResponse.json(categories)
  } catch (error) {
    logger.error('Error fetching gallery categories:', error)
    return NextResponse.json([], { status: 200 })
  }
}

// POST create a new gallery category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const business = await getCurrentBusiness()
    if (!business) return createAuthResponse('Business not found', 404)

    const settings = (business.settings as any) || {}
    const categories = settings.galleryCategories || []

    // Validate name and uniqueness (case-insensitive)
    const rawName = (body.name || '').toString().trim()
    if (!rawName) return fail('Category name is required', 400)
    const norm = rawName.toLocaleLowerCase()
    const exists = categories.some((c: any) => (c?.name || '').toString().trim().toLocaleLowerCase() === norm)
    if (exists) return fail('A category with this name already exists', 400)

    try {
      const nextOrder = body.order || (categories.length + 1)
      const row: any[] = await prisma.$queryRawUnsafe(
        'INSERT INTO public.business_gallery_categories ("businessId", name, "order") VALUES ($1, $2, $3) RETURNING id, name, "order"',
        business.id, rawName, nextOrder
      )
      const created = row[0] || { id: Date.now().toString(), name: rawName, order: nextOrder }
      const updated = [...categories, { id: created.id, name: created.name, order: created.order }]
      await prisma.business.update({ where: { id: business.id }, data: { settings: { ...settings, galleryCategories: updated } } })
      return ok(created)
    } catch (e) {
      const newCategory = { id: Date.now().toString(), name: rawName, order: body.order || categories.length + 1 }
      const updated = [...categories, newCategory]
      await prisma.business.update({ where: { id: business.id }, data: { settings: { ...settings, galleryCategories: updated } } })
      return ok(newCategory)
    }
  } catch (error) {
    logger.error('Error creating gallery category:', error)
    return fail('Failed to create gallery category', 500)
  }
}

// PUT update a gallery category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const business = await getCurrentBusiness()
    if (!business) return createAuthResponse('Business not found', 404)

    const settings = (business.settings as any) || {}
    let categories = settings.galleryCategories || []

    if (body.name !== undefined && body.id) {
      const rawName = (body.name || '').toString().trim()
      const norm = rawName.toLocaleLowerCase()
      const exists = categories.some((c: any) => c.id !== body.id && (c?.name || '').toString().trim().toLocaleLowerCase() === norm)
      if (exists) {
        return NextResponse.json({ error: 'A category with this name already exists' }, { status: 400 })
      }
    }

    try {
      const rowId = body.id
      const rawName = body.name !== undefined ? (body.name || '').toString().trim() : undefined
      if (rawName !== undefined) {
        await prisma.$executeRawUnsafe(
          'UPDATE public.business_gallery_categories SET name = $1, "order" = COALESCE($2, "order"), "updatedAt" = now() WHERE id = $3 AND "businessId" = $4',
          rawName, body.order ?? null, rowId, business.id
        )
      } else if (body.order !== undefined) {
        await prisma.$executeRawUnsafe(
          'UPDATE public.business_gallery_categories SET "order" = $1, "updatedAt" = now() WHERE id = $2 AND "businessId" = $3',
          body.order, rowId, business.id
        )
      }
    } catch (e) {
      // ignore if table missing
    }
    categories = categories.map((cat: any) => (cat.id === body.id ? { ...cat, name: body.name ?? cat.name, order: body.order ?? cat.order } : cat))
    await prisma.business.update({ where: { id: business.id }, data: { settings: { ...settings, galleryCategories: categories } } })
    return ok()
  } catch (error) {
    logger.error('Error updating gallery category:', error)
    return fail('Failed to update gallery category', 500)
  }
}

// DELETE a gallery category
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('id')
    if (!categoryId) return fail('Category ID required', 400)

    const business = await getCurrentBusiness()
    if (!business) return createAuthResponse('Business not found', 404)

    const settings = (business.settings as any) || {}
    let categories = settings.galleryCategories || []

    try {
      await prisma.$executeRawUnsafe('DELETE FROM public.business_gallery_categories WHERE id = $1 AND "businessId" = $2', categoryId, business.id)
    } catch (e) {}
    categories = categories.filter((cat: any) => cat.id !== categoryId)
    await prisma.business.update({ where: { id: business.id }, data: { settings: { ...settings, galleryCategories: categories } } })
    return ok()
  } catch (error) {
    logger.error('Error deleting gallery category:', error)
    return fail('Failed to delete gallery category', 500)
  }
}
