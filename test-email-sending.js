// Test email sending directly
async function testEmailSending() {
  try {
    console.log('\n========================================')
    console.log('TESTING EMAIL SENDING')
    console.log('========================================')
    
    // Test appointment ID (use a real one from your database)
    const appointmentId = '42bad748-21b6-48f7-806d-ba8326e3b13a'
    const testEmail = 'test@example.com' // Change this to your email for testing
    
    const reviewLink = `http://localhost:3000/review/${appointmentId}`
    
    const emailData = {
      customerName: 'Test Customer',
      businessName: 'wmC',
      serviceName: 'Clase1',
      appointmentDate: new Date().toLocaleDateString(),
      reviewLink: reviewLink
    }
    
    const body = {
      appointmentId: appointmentId,
      testEmail: testEmail, // For testing purposes
      emailData: emailData
    }
    
    console.log('Sending test email to:', testEmail)
    console.log('Review link:', reviewLink)
    
    // Call the API endpoint
    const response = await fetch('http://localhost:3001/api/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('\n✅ Email sent successfully!')
      console.log('Check your inbox at:', testEmail)
    } else {
      console.log('\n❌ Failed to send email')
      console.log('Error:', result.error)
    }
    
    console.log('========================================\n')
  } catch (error) {
    console.error('Error:', error)
  }
}

testEmailSending()