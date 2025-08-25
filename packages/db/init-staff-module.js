const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initStaffModule() {
  try {
    // Get all businesses
    const businesses = await prisma.business.findMany()
    
    let updated = 0
    for (const business of businesses) {
      // Update each business individually
      await prisma.business.update({
        where: { id: business.id },
        data: {
          enableStaffModule: business.enableStaffModule ?? false
        }
      })
      updated++
    }

    console.log(`Updated ${updated} businesses with enableStaffModule field`)

    // Show current status
    const allBusinesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        enableStaffModule: true
      }
    })

    console.log('\nCurrent business status:')
    allBusinesses.forEach(b => {
      console.log(`- ${b.name}: enableStaffModule = ${b.enableStaffModule}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initStaffModule()