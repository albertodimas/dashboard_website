// Test booking with shorter phone number
async function testBooking() {
  try {
    const bookingData = {
      businessId: "351ef5f0-8bbf-4c85-a61d-0ae428fa3953",
      serviceId: "cafb00ae-3b34-4079-950a-2922d16c7a98",
      date: "2025-01-28",
      time: "11:00",
      customerName: "Maria Lopez",
      customerEmail: "maria@example.com",
      customerPhone: "1234567", // 7 digits - should work now
      notes: "Test booking with shorter phone"
    }

    console.log('Testing with phone:', bookingData.customerPhone)

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
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testBooking()
