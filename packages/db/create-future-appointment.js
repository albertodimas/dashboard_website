const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createFutureAppointment() {
  try {
    // Buscar el customer de Trading (que tiene la cita existente)
    const customer = await prisma.customer.findFirst({
      where: {
        email: 'walny.mc@gmail.com',
        tenantId: '8d9788cd-d6e1-44ed-8c9d-afe669e53dc4' // Trading tenant
      }
    })

    if (!customer) {
      console.log('Customer no encontrado')
      return
    }

    // Buscar el negocio Trading
    const business = await prisma.business.findFirst({
      where: {
        name: 'Trading',
        tenantId: '8d9788cd-d6e1-44ed-8c9d-afe669e53dc4'
      }
    })

    if (!business) {
      console.log('Business no encontrado')
      return
    }

    // Buscar un servicio del negocio
    const service = await prisma.service.findFirst({
      where: {
        businessId: business.id
      }
    })

    if (!service) {
      console.log('Service no encontrado')
      return
    }

    // Buscar un staff del negocio
    const staff = await prisma.staff.findFirst({
      where: {
        businessId: business.id
      }
    })

    if (!staff) {
      console.log('Staff no encontrado')
      return
    }

    // Crear una cita para mañana a las 10:00 AM
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    
    const endTime = new Date(tomorrow)
    endTime.setMinutes(endTime.getMinutes() + service.duration)

    const appointment = await prisma.appointment.create({
      data: {
        tenantId: business.tenantId,
        businessId: business.id,
        customerId: customer.id,
        serviceId: service.id,
        staffId: staff.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        startTime: tomorrow,
        endTime: endTime,
        status: 'CONFIRMED',
        price: service.price,
        totalAmount: service.price
      }
    })

    console.log('Cita futura creada exitosamente:')
    console.log(`  ID: ${appointment.id}`)
    console.log(`  Cliente: ${customer.name}`)
    console.log(`  Servicio: ${service.name}`)
    console.log(`  Fecha: ${tomorrow.toLocaleDateString()} ${tomorrow.toLocaleTimeString()}`)
    console.log(`  Estado: ${appointment.status}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createFutureAppointment()