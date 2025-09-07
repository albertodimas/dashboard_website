const { PrismaClient } = require('../packages/db/node_modules/@prisma/client')
const jwt = require('../packages/db/node_modules/jsonwebtoken')
const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

async function testBusinessesAPI() {
  try {
    // Obtener el primer customer con email walny.mc@gmail.com
    const customer = await prisma.customer.findFirst({
      where: {
        email: 'walny.mc@gmail.com'
      }
    })

    if (!customer) {
      console.log('No se encontró el customer')
      return
    }

    console.log('Customer encontrado:', customer.name, '(ID:', customer.id, ')')

    // Generar un token JWT como lo haría el login
    const token = jwt.sign(
      { 
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
        emailVerified: customer.emailVerified
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log('\n=== Token generado ===')
    console.log('Token:', token.substring(0, 50) + '...')

    // Simular la lógica de la API de businesses
    console.log('\n=== Simulando API de businesses ===')
    
    // Buscar todos los customers con el mismo email y contraseña
    const allCustomersWithSameEmail = await prisma.customer.findMany({
      where: {
        email: customer.email.toLowerCase(),
        password: customer.password // Solo los que tienen la misma contraseña
      },
      include: {
        tenant: {
          include: {
            businesses: {
              where: {
                isActive: true,
                isBlocked: false
              },
              select: {
                id: true,
                name: true,
                slug: true,
                customSlug: true,
                city: true,
                state: true
              }
            }
          }
        }
      }
    })

    console.log(`\nEncontrados ${allCustomersWithSameEmail.length} customers con el mismo email y contraseña:`)
    
    const myBusinesses = []
    allCustomersWithSameEmail.forEach(customer => {
      console.log(`\n- Customer en Tenant: ${customer.tenant.name}`)
      customer.tenant.businesses.forEach(business => {
        console.log(`  -> ${business.name} (${business.customSlug || business.slug})`)
        myBusinesses.push({
          ...business,
          customerId: customer.id
        })
      })
    })

    console.log(`\n=== Total de negocios donde está registrado: ${myBusinesses.length} ===`)
    myBusinesses.forEach(b => {
      console.log(`- ${b.name} en ${b.city}, ${b.state}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testBusinessesAPI()