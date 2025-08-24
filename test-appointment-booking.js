// Test appointment booking with email
async function testAppointmentBooking() {
  try {
    console.log('\n========================================')
    console.log('TESTING APPOINTMENT BOOKING WITH EMAIL')
    console.log('========================================')
    
    const appointmentData = {
      businessId: '351ef5f0-8bbf-4c85-a61d-0ae428fa3953', // Your business ID
      serviceId: 'cafb00ae-3b34-4079-950a-2922d16c7a98', // Service ID
      date: new Date().toISOString().split('T')[0], // Today
      time: '14:00',
      customerName: 'Test Customer',
      customerEmail: 'appointmentlab@gmail.com', // Your email
      customerPhone: '1234567890',
      notes: 'Test booking with email confirmation'
    }
    
    console.log('Creating appointment for:', appointmentData.customerEmail)
    console.log('Date:', appointmentData.date)
    console.log('Time:', appointmentData.time)
    
    // Call the API endpoint
    const response = await fetch('http://localhost:3001/api/public/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData)
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('\n✅ Appointment created successfully!')
      console.log('Appointment ID:', result.appointment.id)
      console.log('\n📧 Check your email at:', appointmentData.customerEmail)
      console.log('You should receive a confirmation email with a link to confirm the appointment')
    } else {
      console.log('\n❌ Failed to create appointment')
      console.log('Error:', result.error)
    }
    
    console.log('========================================\n')
  } catch (error) {
    console.error('Error:', error)
  }
}

testAppointmentBooking()