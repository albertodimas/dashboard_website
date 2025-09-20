import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { ok, fail } from '@/lib/api-utils'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET all categories for the business
export async function GET() {
  try {
    // Get current business
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // Prefer relational table if available and non-empty
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        'SELECT id, name, "order" FROM public.business_service_categories WHERE "businessId" = $1 ORDER BY "order" ASC',
        business.id
      )
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json(rows.map(r => ({ id: r.id, name: r.name, order: Number(r.order) || 0 })))
      }
    } catch (e) {
      // Table may not exist yet; fallback to JSON
    }
    const settings = (business.settings as any) || {}
    const categories = settings.serviceCategories || []
    return NextResponse.json(categories)
  } catch (error) {
    logger.error('Error fetching categories:', error)
    return NextResponse.json([], { status: 200 })
  }
}

// POST create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get current business
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const settings = (business.settings as any) || {}
    const categories = settings.serviceCategories || []
    
    // Validate name
    const rawName = (body.name || '').toString().trim()
    if (!rawName) return fail('Category name is required', 400)
    const norm = rawName.toLocaleLowerCase()
    const exists = categories.some((c: any) => (c?.name || '').toString().trim().toLocaleLowerCase() === norm)
    if (exists) return fail('A category with this name already exists', 400)
    // Try relational write first, fallback to settings JSON
    try {
      const nextOrder = body.order || (categories.length + 1)
      const row: any[] = await prisma.$queryRawUnsafe(
        'INSERT INTO public.business_service_categories ("businessId", name, "order") VALUES ($1, $2, $3) RETURNING id, name, "order"',
        business.id, rawName, nextOrder
      )
      const created = row[0] || { id: Date.now().toString(), name: rawName, order: nextOrder }
      // Keep JSON in sync (best-effort)
      const updated = [...categories, { id: created.id, name: created.name, order: created.order }]
      await prisma.business.update({
        where: { id: business.id },
        data: { settings: { ...settings, serviceCategories: updated } }
      })
      return ok(created)
    } catch (e) {
      // Fallback to JSON storage
      const newCategory = { id: Date.now().toString(), name: rawName, order: body.order || categories.length + 1 }
      const updated = [...categories, newCategory]
      await prisma.business.update({ where: { id: business.id }, data: { settings: { ...settings, serviceCategories: updated } } })
      return ok(newCategory)
    }
  } catch (error) {
    logger.error('Error creating category:', error)
    return fail('Failed to create category', 500)
  }
}

// PUT update a category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get current business
    const business = await getCurrentBusiness()

    if (!business) return createAuthResponse('Business not found', 404)

    const settings = (business.settings as any) || {}
    let categories = settings.serviceCategories || []
    
    // If updating name, enforce case-insensitive uniqueness (excluding current id)
    if (body.name !== undefined && body.id) {
      const rawName = (body.name || '').toString().trim()
      const norm = rawName.toLocaleLowerCase()
      const exists = categories.some((c: any) => c.id !== body.id && (c?.name || '').toString().trim().toLocaleLowerCase() === norm)
      if (exists) return fail('A category with this name already exists', 400)
    }
    
    // Try relational update; mirror to settings JSON
    try {
      const rowId = body.id
      const rawName = body.name !== undefined ? (body.name || '').toString().trim() : undefined
      if (rawName !== undefined) {
        await prisma.$executeRawUnsafe(
          'UPDATE public.business_service_categories SET name = $1, "order" = COALESCE($2, "order"), "updatedAt" = now() WHERE id = $3 AND "businessId" = $4',
          rawName, body.order ?? null, rowId, business.id
        )
      } else if (body.order !== undefined) {
        await prisma.$executeRawUnsafe(
          'UPDATE public.business_service_categories SET "order" = $1, "updatedAt" = now() WHERE id = $2 AND "businessId" = $3',
          body.order, rowId, business.id
        )
      }
    } catch (e) {
      // ignore if table missing; we'll keep JSON path below
    }
    // Always keep JSON path updated for backwards compatibility
    categories = categories.map((cat: any) => (cat.id === body.id ? { ...cat, name: body.name ?? cat.name, order: body.order ?? cat.order } : cat))
    await prisma.business.update({ where: { id: business.id }, data: { settings: { ...settings, serviceCategories: categories } } })
    return ok()
  } catch (error) {
    logger.error('Error updating category:', error)
    return fail('Failed to update category', 500)
  }
}

// DELETE a category
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('id')
    
    if (!categoryId) return fail('Category ID required', 400)
    
    // Get current business
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    const settings = (business.settings as any) || {}
    let categories = settings.serviceCategories || []
    
    try {
      await prisma.$executeRawUnsafe('DELETE FROM public.business_service_categories WHERE id = $1 AND "businessId" = $2', categoryId, business.id)
    } catch (e) {
      // ignore if not exists
    }
    categories = categories.filter((cat: any) => cat.id !== categoryId)
    await prisma.business.update({ where: { id: business.id }, data: { settings: { ...settings, serviceCategories: categories } } })
    return ok()
  } catch (error) {
    logger.error('Error deleting category:', error)
    return fail('Failed to delete category', 500)
  }
}
