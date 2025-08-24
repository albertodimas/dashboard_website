// Script para probar el flujo de reviews
// Este script marca una cita como completada para poder probar el flujo de review

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testReviewFlow() {
  try {
    // Buscar una cita pendiente o confirmarla
    let appointment = await prisma.appointment.findFirst({
      where: {
        status: 'PENDING'
      },
      include: {
        customer: true,
        service: true,
        business: true
      }
    })

    if (!appointment) {
      console.log('No pending appointments found. Creating a test appointment...')
      
      // Get first business and service
      const business = await prisma.business.findFirst()
      const service = await prisma.service.findFirst({
        where: { businessId: business.id }
      })
      const customer = await prisma.customer.findFirst({
        where: { tenantId: business.tenantId }
      })

      if (!business || !service || !customer) {
        console.log('Missing required data. Please ensure you have a business, service, and customer.')
        return
      }

      // Create a test appointment in the past so it can be marked as completed
      const startTime = new Date()
      startTime.setHours(startTime.getHours() - 2) // 2 hours ago
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + service.duration)

      appointment = await prisma.appointment.create({
        data: {
          tenantId: business.tenantId,
          businessId: business.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: (await prisma.staff.findFirst({ where: { businessId: business.id } }))?.id,
          startTime,
          endTime,
          status: 'PENDING',
          price: service.price,
          totalAmount: service.price
        },
        include: {
          customer: true,
          service: true,
          business: true
        }
      })
      console.log('✓ Test appointment created')
    }

    // Mark appointment as completed
    const completedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    console.log('\n========================================')
    console.log('APPOINTMENT MARKED AS COMPLETED')
    console.log('========================================')
    console.log(`Customer: ${appointment.customer.name}`)
    console.log(`Service: ${appointment.service.name}`)
    console.log(`Business: ${appointment.business.name}`)
    console.log('\n📧 Review Email Would Be Sent To:', appointment.customer.email)
    console.log('\n🔗 Review Link:')
    console.log(`http://localhost:3000/review/${appointment.id}`)
    console.log('\n========================================')
    console.log('INSTRUCTIONS:')
    console.log('1. Click the review link above to test the review submission page')
    console.log('2. The customer can rate and leave a comment')
    console.log('3. The review will appear on the business landing page')
    console.log('========================================\n')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testReviewFlow()