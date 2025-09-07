const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function createMissingCustomers() {
  try {
    // Obtener el customer existente para copiar sus datos
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: 'walny.mc@gmail.com'
      }
    })

    if (!existingCustomer) {
      console.log('No se encontró el customer existente')
      return
    }

    console.log('Customer existente encontrado:', existingCustomer.name)
    console.log('Password hash:', existingCustomer.password)

    // Buscar los tenants de wmcFit y Trading
    const wmcFitTenant = await prisma.tenant.findFirst({
      where: { name: 'wmcFit' }
    })

    const tradingTenant = await prisma.tenant.findFirst({
      where: { name: 'trading' }
    })

    // Crear customer en wmcFit si no existe
    if (wmcFitTenant) {
      const wmcFitCustomer = await prisma.customer.findFirst({
        where: {
          email: 'walny.mc@gmail.com',
          tenantId: wmcFitTenant.id
        }
      })

      if (!wmcFitCustomer) {
        const newWmcFitCustomer = await prisma.customer.create({
          data: {
            tenantId: wmcFitTenant.id,
            email: 'walny.mc@gmail.com',
            name: existingCustomer.name,
            phone: existingCustomer.phone,
            password: existingCustomer.password, // Usar el mismo hash de password
            emailVerified: true,
            source: 'PORTAL'
          }
        })
        console.log('✅ Customer creado en wmcFit:', newWmcFitCustomer.id)
      } else {
        console.log('Customer ya existe en wmcFit')
      }
    }

    // Crear customer en Trading si no existe
    if (tradingTenant) {
      const tradingCustomer = await prisma.customer.findFirst({
        where: {
          email: 'walny.mc@gmail.com',
          tenantId: tradingTenant.id
        }
      })

      if (!tradingCustomer) {
        const newTradingCustomer = await prisma.customer.create({
          data: {
            tenantId: tradingTenant.id,
            email: 'walny.mc@gmail.com',
            name: existingCustomer.name,
            phone: existingCustomer.phone,
            password: existingCustomer.password, // Usar el mismo hash de password
            emailVerified: true,
            source: 'PORTAL'
          }
        })
        console.log('✅ Customer creado en Trading:', newTradingCustomer.id)
      } else {
        console.log('Customer ya existe en Trading')
      }
    }

    // Verificar que ahora existan en todos los tenants
    console.log('\n=== Verificación final ===')
    const allCustomers = await prisma.customer.findMany({
      where: {
        email: 'walny.mc@gmail.com'
      },
      include: {
        tenant: {
          include: {
            businesses: {
              select: {
                name: true,
                slug: true,
                customSlug: true
              }
            }
          }
        }
      }
    })

    console.log(`Total de customers con email walny.mc@gmail.com: ${allCustomers.length}`)
    allCustomers.forEach(c => {
      console.log(`- ${c.name} en ${c.tenant.name}`)
      if (c.tenant.businesses.length > 0) {
        c.tenant.businesses.forEach(b => {
          console.log(`  -> Negocio: ${b.name} (${b.customSlug || b.slug})`)
        })
      }
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMissingCustomers()