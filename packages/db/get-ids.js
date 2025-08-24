const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function getIds() {
  try {
    const business = await prisma.business.findFirst()
    const service = await prisma.service.findFirst({
      where: { businessId: business?.id }
    })
    
    console.log('Business ID:', business?.id)
    console.log('Service ID:', service?.id)
    console.log('Service Name:', service?.name)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getIds()