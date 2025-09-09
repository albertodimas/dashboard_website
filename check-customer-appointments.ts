import { PrismaClient } from '@dashboard/db'

const prisma = new PrismaClient()

async function checkCustomerAppointments() {
  try {
    // Buscar el cliente por email
    const customer = await prisma.customer.findFirst({
      where: {
        email: 'walny.mc@gmail.com'
      }
    })

    if (!customer) {
      console.log('Cliente no encontrado')
      return
    }

    console.log('Cliente encontrado:', {
      id: customer.id,
      name: customer.name,
      email: customer.email
    })

    // Buscar todas las citas del cliente
    const appointments = await prisma.appointment.findMany({
      where: {
        customerId: customer.id
      },
      include: {
        service: true,
        business: true,
        staff: true
      }
    })

    console.log(`\nTotal de citas encontradas: ${appointments.length}`)
    
    if (appointments.length > 0) {
      console.log('\nDetalles de las citas:')
      appointments.forEach((apt, index) => {
        console.log(`\nCita ${index + 1}:`)
        console.log(`  - ID: ${apt.id}`)
        console.log(`  - Servicio: ${apt.service.name}`)
        console.log(`  - Negocio: ${apt.business.name}`)
        console.log(`  - Staff: ${apt.staff.name}`)
        console.log(`  - Fecha: ${apt.startTime}`)
        console.log(`  - Estado: ${apt.status}`)
      })
    }

    // También verificar paquetes
    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId: customer.id
      },
      include: {
        package: {
          include: {
            business: true
          }
        }
      }
    })

    console.log(`\nTotal de paquetes: ${packages.length}`)
    if (packages.length > 0) {
      packages.forEach((pkg, index) => {
        console.log(`\nPaquete ${index + 1}:`)
        console.log(`  - Negocio: ${pkg.package.business.name}`)
        console.log(`  - Sesiones restantes: ${pkg.remainingSessions}`)
        console.log(`  - Estado: ${pkg.status}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCustomerAppointments()