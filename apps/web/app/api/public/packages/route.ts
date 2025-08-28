import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessSlug = searchParams.get('business')
    
    if (!businessSlug) {
      return NextResponse.json({ error: 'Business slug required' }, { status: 400 })
    }

    const business = await prisma.business.findFirst({
      where: { 
        OR: [
          { slug: businessSlug },
          { customSlug: businessSlug }
        ]
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const packages = await prisma.package.findMany({
      where: { 
        businessId: business.id,
        isActive: true
      },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    return NextResponse.json(packages)
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}