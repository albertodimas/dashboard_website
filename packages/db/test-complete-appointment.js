// Test completing an appointment (which should trigger review email)
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCompleteAppointment() {
  try {
    // Find a pending appointment
    const appointment = await prisma.appointment.findFirst({
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
      console.log('No pending appointments found')
      return
    }

    console.log('\n========================================')
    console.log('MARKING APPOINTMENT AS COMPLETED')
    console.log('========================================')
    console.log('Customer:', appointment.customer.name)
    console.log('Email:', appointment.customer.email)
    console.log('Service:', appointment.service.name)
    console.log('Business:', appointment.business.name)

    // Mark as completed
    const completed = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    console.log('\n✅ Appointment marked as completed')
    
    // Generate review link
    const reviewLink = `http://localhost:3000/review/${appointment.id}`
    
    console.log('\n📧 EMAIL CONFIGURATION STATUS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (!process.env.RESEND_API_KEY) {
      console.log('❌ Email NOT sent - RESEND_API_KEY not configured')
      console.log('\nTo enable email sending:')
      console.log('1. Sign up for free at https://resend.com/signup')
      console.log('2. Get your API key from the dashboard')
      console.log('3. Add to .env.local: RESEND_API_KEY="your-api-key"')
      console.log('4. Restart the development server')
    } else {
      console.log('✅ Email service configured - email should be sent')
    }
    
    console.log('\n🔗 Review Link (customer would receive this via email):')
    console.log(reviewLink)
    console.log('\n========================================')
    console.log('You can test the review page by visiting the link above')
    console.log('========================================\n')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCompleteAppointment()