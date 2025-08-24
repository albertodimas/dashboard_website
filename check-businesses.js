const { PrismaClient } = require('./packages/db')
const prisma = new PrismaClient()

async function checkBusinesses() {
  try {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true
      },
      take: 5
    })
    
    console.log('Active businesses in database:')
    console.log('==============================')
    
    if (businesses.length === 0) {
      console.log('No active businesses found.')
      console.log('\nTo test the landing page, create a business first in the admin panel.')
    } else {
      businesses.forEach(business => {
        console.log(`\nName: ${business.name}`)
        console.log(`Slug: ${business.slug}`)
        console.log(`URL: http://localhost:3001/business/${business.slug}`)
        console.log(`Description: ${business.description || 'No description'}`)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBusinesses()