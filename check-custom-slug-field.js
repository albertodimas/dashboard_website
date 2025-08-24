const { PrismaClient } = require('./node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client')
const prisma = new PrismaClient()

async function checkField() {
  try {
    // Check if the customSlug field exists by trying to query it
    const business = await prisma.$queryRaw`
      SELECT id, name, slug, "customSlug" 
      FROM businesses 
      WHERE slug = 'default-business'
      LIMIT 1
    `
    
    console.log('Business data:', business)
    
    if (business && business.length > 0) {
      console.log('\nCustom slug value:', business[0].customSlug)
    }
  } catch (error) {
    console.error('Error:', error.message)
    console.log('\nThis likely means the customSlug field does not exist in the database.')
  } finally {
    await prisma.$disconnect()
  }
}

checkField()