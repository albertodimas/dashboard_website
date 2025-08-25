const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function enableStaffForUser123() {
  try {
    // Enable for user123's business (walny.mc@gmail.com)
    const business = await prisma.business.update({
      where: { id: 'f0501ec8-7da2-4204-81a8-4765f94d3ea6' },
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

enableStaffForUser123()