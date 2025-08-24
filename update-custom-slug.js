const { PrismaClient } = require('./packages/db')
const prisma = new PrismaClient()

async function updateCustomSlug() {
  try {
    // First find the business
    const business = await prisma.business.findFirst({
      where: { slug: 'default-business' }
    })
    
    if (!business) {
      console.log('Business not found')
      return
    }
    
    // Update the business with a custom slug
    const updated = await prisma.business.update({
      where: { id: business.id },
      data: {
        customSlug: 'wmc/inicio'
      }
    })
    
    console.log('Business updated successfully!')
    console.log('Custom URL:', updated.customSlug)
    console.log('\nYou can now access the business page at:')
    console.log('http://localhost:3000/wmc/inicio')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCustomSlug()