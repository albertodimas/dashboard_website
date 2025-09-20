import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { logger } from '@/lib/logger'

// GET all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { businesses: true }
        }
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    logger.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug: body.slug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      )
    }

    // Get the highest order number
    const maxOrder = await prisma.category.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        icon: body.icon || '📋',
        color: body.color || '#B2BEC3',
        isActive: body.isActive !== false,
        order: (maxOrder?.order || 0) + 1
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    logger.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}

// PUT update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) {
      // Check if new slug is unique
      const existing = await prisma.category.findFirst({
        where: { 
          slug: body.slug,
          NOT: { id: body.id }
        }
      })
      
      if (existing) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 400 }
        )
      }
      updateData.slug = body.slug
    }
    if (body.description !== undefined) updateData.description = body.description
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.color !== undefined) updateData.color = body.color
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.order !== undefined) updateData.order = body.order

    const category = await prisma.category.update({
      where: { id: body.id },
      data: updateData
    })

    return NextResponse.json(category)
  } catch (error) {
    logger.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Check if category has businesses
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { businesses: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (category._count.businesses > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${category._count.businesses} businesses. Please reassign businesses first.` },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}