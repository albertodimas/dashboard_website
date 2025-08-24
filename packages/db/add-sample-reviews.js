const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addSampleReviews() {
  try {
    // Get the first business
    const business = await prisma.business.findFirst()
    
    if (!business) {
      console.log('No business found')
      return
    }

    console.log(`Adding sample reviews for ${business.name}...`)

    // Sample customer data
    const sampleCustomers = [
      { name: 'Maria Garcia', email: 'maria@example.com', phone: '555-0101' },
      { name: 'John Smith', email: 'john@example.com', phone: '555-0102' },
      { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '555-0103' },
      { name: 'Michael Brown', email: 'michael@example.com', phone: '555-0104' },
      { name: 'Emily Davis', email: 'emily@example.com', phone: '555-0105' },
      { name: 'David Wilson', email: 'david@example.com', phone: '555-0106' }
    ]

    // Sample reviews
    const sampleReviews = [
      {
        rating: 5,
        comment: 'Excellent service! The staff was very professional and the results exceeded my expectations. Will definitely come back!',
        customerIndex: 0
      },
      {
        rating: 5,
        comment: 'Amazing experience from start to finish. The booking process was easy and the service was top-notch.',
        customerIndex: 1
      },
      {
        rating: 4,
        comment: 'Great service overall. The only reason I\'m not giving 5 stars is because I had to wait a bit, but the quality was worth it.',
        customerIndex: 2
      },
      {
        rating: 5,
        comment: 'Best in town! I\'ve tried other places but nothing compares to the quality and attention to detail here.',
        customerIndex: 3
      },
      {
        rating: 5,
        comment: 'Absolutely fantastic! The team is friendly, professional, and really knows what they\'re doing. Highly recommended!',
        customerIndex: 4
      },
      {
        rating: 4,
        comment: 'Very satisfied with the service. Clean, professional environment and great results. Will be back soon!',
        customerIndex: 5
      }
    ]

    for (const review of sampleReviews) {
      const customerData = sampleCustomers[review.customerIndex]
      
      // Find or create customer
      let customer = await prisma.customer.findFirst({
        where: {
          email: customerData.email,
          tenantId: business.tenantId
        }
      })

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            ...customerData,
            tenantId: business.tenantId
          }
        })
      }

      // Check if review already exists
      const existingReview = await prisma.review.findFirst({
        where: {
          customerId: customer.id,
          businessId: business.id
        }
      })

      if (!existingReview) {
        await prisma.review.create({
          data: {
            tenantId: business.tenantId,
            businessId: business.id,
            customerId: customer.id,
            rating: review.rating,
            comment: review.comment,
            isPublished: true,
            publishedAt: new Date()
          }
        })
        console.log(`✓ Added review from ${customerData.name}`)
      } else {
        console.log(`- Review from ${customerData.name} already exists`)
      }
    }

    console.log('Sample reviews added successfully!')
  } catch (error) {
    console.error('Error adding sample reviews:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleReviews()