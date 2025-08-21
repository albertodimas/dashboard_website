import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

// GET all categories for the business
export async function GET() {
  try {
    // Get default business
    const business = await prisma.business.findFirst({
      where: { slug: 'default-business' }
    })

    if (!business) {
      return NextResponse.json({ 
        error: 'Business not found',
        categories: [] 
      }, { status: 404 })
    }

    // Get categories from business settings
    const settings = business.settings as any || {}
    const categories = settings.serviceCategories || []

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json([], { status: 200 })
  }
}

// POST create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get default business
    const business = await prisma.business.findFirst({
      where: { slug: 'default-business' }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get current settings
    const settings = business.settings as any || {}
    const categories = settings.serviceCategories || []
    
    // Add new category
    const newCategory = {
      id: Date.now().toString(),
      name: body.name,
      order: body.order || categories.length + 1
    }
    
    categories.push(newCategory)
    
    // Update business settings
    await prisma.business.update({
      where: { id: business.id },
      data: {
        settings: {
          ...settings,
          serviceCategories: categories
        }
      }
    })

    return NextResponse.json(newCategory)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}

// PUT update a category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get default business
    const business = await prisma.business.findFirst({
      where: { slug: 'default-business' }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get current settings
    const settings = business.settings as any || {}
    let categories = settings.serviceCategories || []
    
    // Update category
    categories = categories.map((cat: any) => 
      cat.id === body.id 
        ? { ...cat, name: body.name, order: body.order }
        : cat
    )
    
    // Update business settings
    await prisma.business.update({
      where: { id: business.id },
      data: {
        settings: {
          ...settings,
          serviceCategories: categories
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE a category
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('id')
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID required' },
        { status: 400 }
      )
    }
    
    // Get default business
    const business = await prisma.business.findFirst({
      where: { slug: 'default-business' }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get current settings
    const settings = business.settings as any || {}
    let categories = settings.serviceCategories || []
    
    // Remove category
    categories = categories.filter((cat: any) => cat.id !== categoryId)
    
    // Update business settings
    await prisma.business.update({
      where: { id: business.id },
      data: {
        settings: {
          ...settings,
          serviceCategories: categories
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}