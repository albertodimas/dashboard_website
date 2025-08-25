const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function enableStaffForFirstBusiness() {
  try {
    // Get first business
    const business = await prisma.business.findFirst({
      orderBy: { createdAt: 'asc' }
    })
    
    if (!business) {
      console.log('No businesses found')
      return
    }

    console.log(`Found business: ${business.name}`)
    console.log(`Current enableStaffModule: ${business.enableStaffModule}`)
    
    // Enable staff module
    const updated = await prisma.business.update({
      where: { id: business.id },
      data: { enableStaffModule: true }
    })
    
    console.log(`\nUpdated business: ${updated.name}`)
    console.log(`New enableStaffModule: ${updated.enableStaffModule}`)
    
    // Show all businesses status
    console.log('\n=== All Businesses Status ===')
    const allBusinesses = await prisma.business.findMany({
      select: {
        name: true,
        enableStaffModule: true,
        email: true
      }
    })
    
    allBusinesses.forEach(b => {
      console.log(`${b.name} (${b.email}): Staff Module = ${b.enableStaffModule ? 'ENABLED ✅' : 'DISABLED ❌'}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enableStaffForFirstBusiness()