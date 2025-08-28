const bookingData = {
  businessId: "f0501ec8-7da2-4204-81a8-4765f94d3ea6",
  serviceId: "1a4b6206-12e8-442e-b9c4-243186a7c506",
  date: "2025-08-29",
  time: "11:00",
  customerName: "Test Customer",
  customerEmail: "test@example.com",
  customerPhone: "1234567890"
};

console.log('Creating booking with:', bookingData);

const response = await fetch('http://localhost:3002/api/public/appointments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(bookingData)
});

const result = await response.json();
console.log('Response:', result);