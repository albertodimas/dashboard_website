const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkStatus() {
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        enableStaffModule: true,
        tenant: {
          select: {
            users: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    })
    
    console.log('=== Business Staff Module Status ===\n')
    businesses.forEach(b => {
      console.log(`Business: ${b.name}`)
      console.log(`Email: ${b.email}`)
      console.log(`Staff Module: ${b.enableStaffModule ? '✅ ENABLED' : '❌ DISABLED'}`)
      console.log(`Business ID: ${b.id}`)
      if (b.tenant.users.length > 0) {
        console.log('Users:')
        b.tenant.users.forEach(u => {
          console.log(`  - ${u.name} (${u.email})`)
        })
      }
      console.log('---')
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStatus()