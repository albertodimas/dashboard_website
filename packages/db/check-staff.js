const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAndCreateStaff() {
  try {
    // Get the first business
    const business = await prisma.business.findFirst()
    
    if (!business) {
      console.log('No business found')
      return
    }

    console.log(`Checking staff for ${business.name}...`)

    // Check if business has staff
    const staff = await prisma.staff.findMany({
      where: { businessId: business.id }
    })

    if (staff.length === 0) {
      console.log('No staff found. Creating default staff member...')
      
      const newStaff = await prisma.staff.create({
        data: {
          tenantId: business.tenantId,
          businessId: business.id,
          name: 'General Staff',
          email: 'staff@' + business.email?.split('@')[1] || 'example.com',
          role: 'TECHNICIAN',
          isActive: true
        }
      })
      
      console.log('✓ Created default staff member:', newStaff.name)
    } else {
      console.log(`Found ${staff.length} staff member(s):`)
      staff.forEach(s => {
        console.log(`  - ${s.name} (${s.role}) - Active: ${s.isActive}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndCreateStaff()