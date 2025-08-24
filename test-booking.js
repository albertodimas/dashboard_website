// Test booking submission
async function testBooking() {
  try {
    const bookingData = {
      businessId: "351ef5f0-8bbf-4c85-a61d-0ae428fa3953",
      serviceId: "cafb00ae-3b34-4079-950a-2922d16c7a98",
      date: "2025-01-27",
      time: "10:00",
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      customerPhone: "1234567890",
      notes: "Test booking"
    }

    console.log('Sending booking data:', JSON.stringify(bookingData, null, 2))

    const response = await fetch('http://localhost:3000/api/public/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Booking successful:', result)
    } else {
      console.log('❌ Booking failed:', result)
      if (result.details) {
        console.log('Validation errors:', JSON.stringify(result.details, null, 2))
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testBooking()
