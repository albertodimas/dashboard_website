const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testField() {
  try {
    const business = await prisma.business.findFirst()
    if (business) {
      console.log('Business:', business.name)
      console.log('enableStaffModule field exists:', 'enableStaffModule' in business)
      console.log('enableStaffModule value:', business.enableStaffModule)
    } else {
      console.log('No business found')
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testField()