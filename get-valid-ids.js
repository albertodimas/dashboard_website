const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function getValidIds() {
  try {
    // Get first active business
    const business = await prisma.business.findFirst({
      where: { isActive: true },
      select: { id: true, name: true }
    })
    
    if (!business) {
      console.log('No active business found')
      return
    }
    
    // Get first active service for this business
    const service = await prisma.service.findFirst({
      where: { 
        businessId: business.id,
        isActive: true 
      },
      select: { id: true, name: true }
    })
    
    if (!service) {
      console.log('No active service found')
      return
    }
    
    console.log('\n========================================')
    console.log('VALID IDs FOR TESTING')
    console.log('========================================')
    console.log('Business:', business.name)
    console.log('Business ID:', business.id)
    console.log('\nService:', service.name)
    console.log('Service ID:', service.id)
    console.log('========================================\n')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getValidIds()