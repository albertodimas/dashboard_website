import { PrismaClient } from '@prisma/client'
import { hash } from 'argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create demo tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Luxury Cuts Barbershop',
      subdomain: 'luxurycuts',
      email: 'admin@luxurycuts.com',
      phone: '+1234567890',
      timezone: 'America/New_York',
      currency: 'USD',
      locale: 'en',
      settings: {
        allowOnlineBooking: true,
        requireDeposit: true,
        depositPercentage: 20,
        cancellationHours: 24,
        enableWaitlist: true,
        enableReviews: true,
        enableHomeService: true,
        maxAdvanceBookingDays: 30,
      },
    },
  })

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Glamour Nails Studio',
      subdomain: 'glamournails',
      email: 'admin@glamournails.com',
      phone: '+1234567891',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      locale: 'en',
      settings: {
        allowOnlineBooking: true,
        requireDeposit: false,
        cancellationHours: 12,
        enableWaitlist: true,
        enableReviews: true,
        enableHomeService: false,
        maxAdvanceBookingDays: 14,
      },
    },
  })

  // Create owner users
  const owner1 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'owner@luxurycuts.com',
      passwordHash: await hash('password123'),
      name: 'John Doe',
      emailVerified: new Date(),
      isActive: true,
    },
  })

  const owner2 = await prisma.user.create({
    data: {
      tenantId: tenant2.id,
      email: 'owner@glamournails.com',
      passwordHash: await hash('password123'),
      name: 'Jane Smith',
      emailVerified: new Date(),
      isActive: true,
    },
  })

  // Create businesses
  const business1 = await prisma.business.create({
    data: {
      tenantId: tenant1.id,
      name: 'Luxury Cuts Barbershop',
      slug: 'luxury-cuts',
      description: 'Premium barbershop experience with traditional and modern cuts',
      email: 'contact@luxurycuts.com',
      phone: '+1234567890',
      website: 'https://luxurycuts.com',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      timezone: 'America/New_York',
      currency: 'USD',
      settings: {
        bookingRules: {
          allowSameDay: true,
          minAdvanceHours: 2,
          maxAdvanceDays: 30,
        },
      },
      features: {
        onlineBooking: true,
        homeService: true,
        waitlist: true,
        reviews: true,
      },
    },
  })

  const business2 = await prisma.business.create({
    data: {
      tenantId: tenant2.id,
      name: 'Glamour Nails Studio',
      slug: 'glamour-nails',
      description: 'Professional nail care and artistic designs',
      email: 'contact@glamournails.com',
      phone: '+1234567891',
      address: '456 Sunset Blvd',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90028',
      country: 'US',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      settings: {
        bookingRules: {
          allowSameDay: false,
          minAdvanceHours: 4,
          maxAdvanceDays: 14,
        },
      },
      features: {
        onlineBooking: true,
        homeService: false,
        waitlist: true,
        reviews: true,
      },
    },
  })

  // Create memberships
  await prisma.membership.create({
    data: {
      userId: owner1.id,
      businessId: business1.id,
      role: 'OWNER',
    },
  })

  await prisma.membership.create({
    data: {
      userId: owner2.id,
      businessId: business2.id,
      role: 'OWNER',
    },
  })

  // Create staff for business1
  const staff1 = await prisma.staff.create({
    data: {
      businessId: business1.id,
      userId: owner1.id,
      name: 'John Doe',
      email: 'john@luxurycuts.com',
      phone: '+1234567890',
      bio: 'Master barber with 10+ years experience',
      specialties: ['Classic Cuts', 'Beard Grooming', 'Hot Towel Shave'],
      isActive: true,
      canAcceptBookings: true,
    },
  })

  const staff2 = await prisma.staff.create({
    data: {
      businessId: business1.id,
      name: 'Mike Johnson',
      email: 'mike@luxurycuts.com',
      phone: '+1234567892',
      bio: 'Specialist in modern styles and fades',
      specialties: ['Fades', 'Modern Cuts', 'Hair Design'],
      isActive: true,
      canAcceptBookings: true,
    },
  })

  // Create staff for business2
  const staff3 = await prisma.staff.create({
    data: {
      businessId: business2.id,
      userId: owner2.id,
      name: 'Jane Smith',
      email: 'jane@glamournails.com',
      phone: '+1234567891',
      bio: 'Nail artist and salon owner',
      specialties: ['Gel Nails', 'Nail Art', 'Manicure'],
      isActive: true,
      canAcceptBookings: true,
    },
  })

  // Create working hours
  for (let day = 1; day <= 6; day++) {
    await prisma.workingHour.create({
      data: {
        businessId: business1.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '19:00',
        isActive: true,
      },
    })

    await prisma.workingHour.create({
      data: {
        businessId: business1.id,
        staffId: staff1.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '19:00',
        isActive: true,
      },
    })

    await prisma.workingHour.create({
      data: {
        businessId: business1.id,
        staffId: staff2.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '18:00',
        isActive: true,
      },
    })

    await prisma.workingHour.create({
      data: {
        businessId: business2.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '20:00',
        isActive: true,
      },
    })

    await prisma.workingHour.create({
      data: {
        businessId: business2.id,
        staffId: staff3.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '20:00',
        isActive: true,
      },
    })
  }

  // Create services for barbershop
  const service1 = await prisma.service.create({
    data: {
      tenantId: tenant1.id,
      businessId: business1.id,
      name: 'Classic Haircut',
      description: 'Traditional haircut with styling',
      duration: 30,
      bufferAfter: 5,
      price: 35,
      depositAmount: 10,
      category: 'Haircuts',
      isActive: true,
      allowOnline: true,
      allowHomeService: true,
    },
  })

  const service2 = await prisma.service.create({
    data: {
      tenantId: tenant1.id,
      businessId: business1.id,
      name: 'Beard Trim',
      description: 'Professional beard grooming and shaping',
      duration: 20,
      bufferAfter: 5,
      price: 25,
      depositAmount: 5,
      category: 'Grooming',
      isActive: true,
      allowOnline: true,
      allowHomeService: true,
    },
  })

  const service3 = await prisma.service.create({
    data: {
      tenantId: tenant1.id,
      businessId: business1.id,
      name: 'Hot Towel Shave',
      description: 'Luxury shaving experience with hot towel treatment',
      duration: 45,
      bufferAfter: 10,
      price: 50,
      depositAmount: 15,
      category: 'Premium',
      isActive: true,
      allowOnline: true,
      allowHomeService: false,
    },
  })

  // Create services for nail salon
  const service4 = await prisma.service.create({
    data: {
      tenantId: tenant2.id,
      businessId: business2.id,
      name: 'Basic Manicure',
      description: 'Classic manicure with polish',
      duration: 30,
      bufferAfter: 5,
      price: 30,
      category: 'Manicure',
      isActive: true,
      allowOnline: true,
      allowHomeService: false,
    },
  })

  const service5 = await prisma.service.create({
    data: {
      tenantId: tenant2.id,
      businessId: business2.id,
      name: 'Gel Nails',
      description: 'Long-lasting gel nail application',
      duration: 60,
      bufferAfter: 10,
      price: 55,
      category: 'Gel',
      isActive: true,
      allowOnline: true,
      allowHomeService: false,
    },
  })

  // Link services to staff
  await prisma.serviceStaff.createMany({
    data: [
      { serviceId: service1.id, staffId: staff1.id },
      { serviceId: service1.id, staffId: staff2.id },
      { serviceId: service2.id, staffId: staff1.id },
      { serviceId: service3.id, staffId: staff1.id },
      { serviceId: service4.id, staffId: staff3.id },
      { serviceId: service5.id, staffId: staff3.id },
    ],
  })

  // Create addons
  await prisma.addon.createMany({
    data: [
      {
        serviceId: service1.id,
        name: 'Hair Wash',
        description: 'Refreshing hair wash with premium products',
        price: 10,
        duration: 10,
      },
      {
        serviceId: service1.id,
        name: 'Hair Styling',
        description: 'Professional styling with products',
        price: 15,
        duration: 10,
      },
      {
        serviceId: service5.id,
        name: 'Nail Art',
        description: 'Custom nail art design',
        price: 20,
        duration: 20,
      },
    ],
  })

  // Create sample customers
  for (let i = 0; i < 10; i++) {
    await prisma.customer.create({
      data: {
        tenantId: i < 5 ? tenant1.id : tenant2.id,
        email: `customer${i}@example.com`,
        name: `Customer ${i}`,
        phone: `+123456789${i}`,
        city: i < 5 ? 'New York' : 'Los Angeles',
        state: i < 5 ? 'NY' : 'CA',
        postalCode: i < 5 ? '10001' : '90028',
        country: 'US',
      },
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })