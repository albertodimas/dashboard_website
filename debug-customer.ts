import { prisma } from '@nexodash/db'

async function debugCustomer() {
  try {
    // Buscar todos los customers con ese email
    const customers = await prisma.customer.findMany({
      where: {
        email: 'walny.mc@gmail.com'
      }
    })

    console.log('Customers encontrados con email walny.mc@gmail.com:')
    customers.forEach(c => {
      console.log(`  ID: ${c.id}`)
      console.log(`  Name: ${c.name}`)
      console.log(`  TenantID: ${c.tenantId}`)
      console.log('---')
    })

    // Para cada customer, buscar sus citas
    for (const customer of customers) {
      const appointments = await prisma.appointment.findMany({
        where: {
          customerId: customer.id
        }
      })
      
      console.log(`\nCitas para customer ${customer.id}:`)
      console.log(`  Total: ${appointments.length}`)
      
      if (appointments.length > 0) {
        for (const apt of appointments) {
          console.log(`    - ID: ${apt.id}`)
          console.log(`      Status: ${apt.status}`)
          console.log(`      StartTime: ${apt.startTime}`)
          console.log(`      BusinessId: ${apt.businessId}`)
        }
      }
    }

    // También buscar citas por customerName o customerPhone
    const appointmentsByName = await prisma.appointment.findMany({
      where: {
        OR: [
          { customerName: { contains: 'Allison', mode: 'insensitive' } },
          { customerName: { contains: 'walny', mode: 'insensitive' } },
          { customerPhone: { contains: 'walny.mc', mode: 'insensitive' } }
        ]
      }
    })

    console.log(`\nCitas encontradas por nombre/teléfono:`)
    console.log(`  Total: ${appointmentsByName.length}`)
    appointmentsByName.forEach(apt => {
      console.log(`  - ID: ${apt.id}`)
      console.log(`    CustomerId: ${apt.customerId}`)
      console.log(`    CustomerName: ${apt.customerName}`)
      console.log(`    Status: ${apt.status}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugCustomer()