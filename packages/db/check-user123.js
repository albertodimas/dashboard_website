const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUser123() {
  try {
    const business = await prisma.business.findFirst({
      where: { name: 'user123' }
    })
    
    if (business) {
      console.log('=== Business Details ===')
      console.log('Name:', business.name)
      console.log('ID:', business.id)
      console.log('Slug:', business.slug)
      console.log('CustomSlug:', business.customSlug)
      console.log('EnableStaffModule:', business.enableStaffModule)
      console.log('\nURL para reservas:')
      console.log(`  /book/${business.slug}`)
      if (business.customSlug) {
        console.log(`  /book/${business.customSlug}`)
      }
    } else {
      console.log('Business user123 not found')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser123()