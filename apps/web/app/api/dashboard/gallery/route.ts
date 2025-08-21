import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

// GET all gallery items for the business
export async function GET() {
  try {
    // Get default business
    const business = await prisma.business.findFirst({
      where: { slug: 'default-business' }
    })

    if (!business) {
      return NextResponse.json({ 
        error: 'Business not found',
        gallery: [] 
      }, { status: 404 })
    }

    // Get gallery from business features
    const features = business.features as any || {}
    const gallery = features.gallery || []

    return NextResponse.json(gallery)
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return NextResponse.json([], { status: 200 })
  }
}

// POST create a new gallery item
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

    // Get current features
    const features = business.features as any || {}
    const gallery = features.gallery || []
    
    // Add new gallery item
    const newItem = {
      id: Date.now().toString(),
      type: body.type || 'image',
      url: body.url,
      title: body.title,
      description: body.description || '',
      category: body.category || '',
      createdAt: new Date().toISOString()
    }
    
    gallery.push(newItem)
    
    // Update business features
    await prisma.business.update({
      where: { id: business.id },
      data: {
        features: {
          ...features,
          gallery
        }
      }
    })

    return NextResponse.json(newItem)
  } catch (error) {
    console.error('Error creating gallery item:', error)
    return NextResponse.json(
      { error: 'Failed to create gallery item' },
      { status: 500 }
    )
  }
}

// DELETE a gallery item
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const itemId = url.searchParams.get('id')
    
    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID required' },
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

    // Get current features
    const features = business.features as any || {}
    let gallery = features.gallery || []
    
    // Remove gallery item
    gallery = gallery.filter((item: any) => item.id !== itemId)
    
    // Update business features
    await prisma.business.update({
      where: { id: business.id },
      data: {
        features: {
          ...features,
          gallery
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting gallery item:', error)
    return NextResponse.json(
      { error: 'Failed to delete gallery item' },
      { status: 500 }
    )
  }
}