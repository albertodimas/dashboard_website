// Send a test review email to your actual email address
async function sendTestReviewEmail() {
  try {
    console.log('\n========================================')
    console.log('SENDING TEST REVIEW EMAIL')
    console.log('========================================')
    
    // Use a real appointment ID from your database
    const appointmentId = '42bad748-21b6-48f7-806d-ba8326e3b13a'
    const yourEmail = 'appointmentlab@gmail.com' // Your actual email
    
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
      testEmail: yourEmail,
      emailData: emailData
    }
    
    console.log('Sending review email to:', yourEmail)
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
      console.log('\n✅ Review email sent successfully!')
      console.log('Check your inbox at:', yourEmail)
      console.log('You should receive an email with a link to leave a review')
    } else {
      console.log('\n❌ Failed to send email')
      console.log('Error:', result.error)
    }
    
    console.log('========================================\n')
  } catch (error) {
    console.error('Error:', error)
  }
}

sendTestReviewEmail()