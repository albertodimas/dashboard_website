const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function enableStaffForLeTigre() {
  try {
    // Enable for Le Tigré! business
    const business = await prisma.business.update({
      where: { id: '78323745-627b-41b0-9fd2-427658d4d7d6' },
      data: { enableStaffModule: true }
    })
    
    console.log(`✅ Enabled Staff Module for: ${business.name}`)
    console.log(`   Email: ${business.email}`)
    console.log(`   ID: ${business.id}`)
    
    // Show all businesses status
    console.log('\n=== All Businesses Status ===')
    const allBusinesses = await prisma.business.findMany({
      select: {
        name: true,
        email: true,
        enableStaffModule: true
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

enableStaffForLeTigre()