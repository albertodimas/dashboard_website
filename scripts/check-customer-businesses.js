const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCustomerBusinesses() {
  try {
    // Primero buscar TODOS los tenants con sus negocios
    console.log('=== Verificando estructura de Tenants y Businesses ===')
    const tenants = await prisma.tenant.findMany({
      include: {
        businesses: {
          select: {
            name: true,
            slug: true,
            customSlug: true
          }
        },
        customers: {
          where: {
            email: 'walny.mc@gmail.com'
          },
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    tenants.forEach(tenant => {
      if (tenant.businesses.length > 0) {
        console.log(`\nTenant: ${tenant.name} (ID: ${tenant.id})`)
        console.log('Negocios:')
        tenant.businesses.forEach(b => {
          console.log(`  - ${b.name} (${b.customSlug || b.slug})`)
        })
        console.log('Customers con email walny.mc@gmail.com:', tenant.customers.length)
        if (tenant.customers.length > 0) {
          tenant.customers.forEach(c => {
            console.log(`    - ${c.name} (ID: ${c.id})`)
          })
        }
      }
    })

    // Buscar todos los customers con email walny.mc@gmail.com
    const customers = await prisma.customer.findMany({
      where: {
        email: 'walny.mc@gmail.com'
      },
      include: {
        tenant: {
          include: {
            businesses: {
              select: {
                id: true,
                name: true,
                slug: true,
                customSlug: true
              }
            }
          }
        }
      }
    })

    console.log('=== Customers encontrados con email walny.mc@gmail.com ===')
    console.log('Total:', customers.length)
    
    customers.forEach((customer, index) => {
      console.log(`\n--- Customer ${index + 1} ---`)
      console.log('ID:', customer.id)
      console.log('Name:', customer.name)
      console.log('Tenant ID:', customer.tenantId)
      console.log('Tenant Name:', customer.tenant.name)
      console.log('Businesses en este Tenant:', customer.tenant.businesses.length)
      
      if (customer.tenant.businesses.length > 0) {
        console.log('Negocios:')
        customer.tenant.businesses.forEach(b => {
          console.log(`  - ${b.name} (${b.customSlug || b.slug})`)
        })
      }
    })

    // Verificar si hay appointments para estos customers
    console.log('\n=== Verificando Appointments ===')
    for (const customer of customers) {
      const appointments = await prisma.appointment.findMany({
        where: {
          customerId: customer.id
        },
        include: {
          business: {
            select: {
              name: true,
              slug: true
            }
          }
        }
      })
      
      if (appointments.length > 0) {
        console.log(`\nCustomer ${customer.name} tiene ${appointments.length} appointments:`)
        appointments.forEach(apt => {
          console.log(`  - En ${apt.business.name}`)
        })
      }
    }

    // Verificar todos los negocios activos
    console.log('\n=== Todos los negocios activos ===')
    const allBusinesses = await prisma.business.findMany({
      where: {
        isActive: true,
        isBlocked: false
      },
      select: {
        name: true,
        slug: true,
        customSlug: true,
        tenantId: true,
        tenant: {
          select: {
            name: true
          }
        }
      }
    })

    allBusinesses.forEach(b => {
      console.log(`- ${b.name} (${b.customSlug || b.slug}) - Tenant: ${b.tenant.name}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCustomerBusinesses()