import { NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: {
        business: {
          select: {
            address: true,
            phone: true,
          },
        },
      },
    })

    const formattedServices = services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description ?? '',
      category: (service.category ?? 'general').toLowerCase().replace(/_/g, '-'),
      address: service.business?.address ?? '',
      phone: service.business?.phone ?? '',
      priceRange: service.price > 100 ? '$$$' : service.price > 50 ? '$$' : '$',
      rating: 4.5 + Math.random() * 0.5,
      reviewCount: Math.floor(Math.random() * 500) + 50,
    }))

    return NextResponse.json(formattedServices)
  } catch (error) {
    logger.error('Error fetching services:', error)
    return NextResponse.json([], { status: 200 })
  }
}
