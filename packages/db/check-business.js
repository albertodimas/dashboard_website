const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkBusiness() {
  try {
    // Buscar el business con ID 1fea7339-a9f0-4186-bf20-317181aeb1a7
    const business = await prisma.business.findUnique({
      where: {
        id: '1fea7339-a9f0-4186-bf20-317181aeb1a7'
      }
    })

    console.log('Business encontrado:')
    console.log(`  ID: ${business.id}`)
    console.log(`  Name: ${business.name}`)
    console.log(`  TenantID: ${business.tenantId}`)
    console.log(`  Slug: ${business.slug}`)
    
    // Buscar todos los businesses llamados "Trading"
    const tradingBusinesses = await prisma.business.findMany({
      where: {
        name: { contains: 'Trading' }
      }
    })
    
    console.log('\nTodos los businesses con "Trading" en el nombre:')
    tradingBusinesses.forEach(b => {
      console.log(`  ID: ${b.id}`)
      console.log(`  Name: ${b.name}`)
      console.log(`  TenantID: ${b.tenantId}`)
      console.log('---')
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBusiness()