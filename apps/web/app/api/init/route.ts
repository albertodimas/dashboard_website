import { NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    // Check if tenant exists
    let tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'default' }
    })

    if (!tenant) {
      // Create default tenant
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Tenant',
          subdomain: 'default',
          email: 'admin@dashboard.com',
          phone: '555-0100',
          timezone: 'America/New_York',
          currency: 'USD',
          locale: 'en'
        }
      })
    }

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { 
        tenantId: tenant.id,
        email: 'admin@dashboard.com'
      }
    })

    if (!user) {
      // Create default admin user
      user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: 'admin@dashboard.com',
          name: 'Admin User',
          passwordHash: 'temp_password_hash', // Will be handled by auth later
          emailVerified: new Date()
        }
      })
    }

    // Check if business exists
    let business = await prisma.business.findFirst({
      where: { 
        tenantId: tenant.id,
        slug: 'default-business'
      }
    })

    if (!business) {
      // Create default business
      business = await prisma.business.create({
        data: {
          tenantId: tenant.id,
          name: 'Elite Barber Shop',
          slug: 'default-business',
          description: 'Premium barber shop offering classic and modern styles',
          email: 'contact@elitebarbershop.com',
          phone: '(555) 123-4567',
          address: '123 Main Street',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          timezone: 'America/New_York',
          currency: 'USD',
          settings: {
            timeInterval: 60,
            startTime: '09:00',
            endTime: '18:00',
            workingDays: [1, 2, 3, 4, 5]
          }
        }
      })

      // Create membership
      await prisma.membership.create({
        data: {
          userId: user.id,
          businessId: business.id,
          role: 'OWNER'
        }
      })

      // Create default working hours
      for (let day = 1; day <= 5; day++) {
        await prisma.workingHour.create({
          data: {
            businessId: business.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '18:00'
          }
        })
      }
      
      // Create sample services
      await prisma.service.createMany({
        data: [
          {
            tenantId: tenant.id,
            businessId: business.id,
            name: 'Haircut',
            description: 'Classic or modern haircut',
            duration: 30,
            price: 35,
            category: 'Hair'
          },
          {
            tenantId: tenant.id,
            businessId: business.id,
            name: 'Beard Trim',
            description: 'Professional beard shaping and trim',
            duration: 20,
            price: 25,
            category: 'Beard'
          },
          {
            tenantId: tenant.id,
            businessId: business.id,
            name: 'Hair Color',
            description: 'Full hair coloring service',
            duration: 60,
            price: 75,
            category: 'Hair'
          },
          {
            tenantId: tenant.id,
            businessId: business.id,
            name: 'Hot Towel Shave',
            description: 'Traditional hot towel shave',
            duration: 45,
            price: 45,
            category: 'Shave'
          },
          {
            tenantId: tenant.id,
            businessId: business.id,
            name: 'Hair & Beard Combo',
            description: 'Haircut and beard trim package',
            duration: 50,
            price: 55,
            category: 'Package'
          }
        ]
      })
      
      // Create sample customers
      await prisma.customer.createMany({
        data: [
          {
            tenantId: tenant.id,
            name: 'Michael Johnson',
            email: 'michael@example.com',
            phone: '(555) 234-5678'
          },
          {
            tenantId: tenant.id,
            name: 'Sarah Williams',
            email: 'sarah@example.com',
            phone: '(555) 345-6789'
          },
          {
            tenantId: tenant.id,
            name: 'Robert Brown',
            email: 'robert@example.com',
            phone: '(555) 456-7890'
          }
        ]
      })
      
      // Create sample gallery items
      await prisma.galleryItem.createMany({
        data: [
          {
            businessId: business.id,
            type: 'image',
            url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',
            title: 'Classic Haircut',
            description: 'Traditional gentleman cut',
            category: 'Haircuts',
            order: 1
          },
          {
            businessId: business.id,
            type: 'image',
            url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800',
            title: 'Beard Styling',
            description: 'Professional beard grooming',
            category: 'Beard',
            order: 2
          }
        ]
      })
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        subdomain: tenant.subdomain
      },
      business: {
        id: business.id,
        slug: business.slug
      },
      user: {
        email: user.email,
        message: 'Default password is: admin123'
      }
    })
  } catch (error) {
    logger.error('Init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize system' },
      { status: 500 }
    )
  }
}