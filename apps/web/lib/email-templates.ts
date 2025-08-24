export function getAppointmentConfirmationEmailTemplate(data: {
  customerName: string
  businessName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  confirmationLink: string
  businessAddress?: string
  businessPhone?: string
}) {
  return {
    subject: `Appointment Confirmation - ${data.businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Confirmation</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              padding: 30px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .business-name {
              color: #2563eb;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .confirmation-box {
              background: #10b981;
              color: white;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .appointment-details {
              background: #f3f4f6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              margin: 12px 0;
              display: flex;
              align-items: center;
            }
            .detail-label {
              font-weight: bold;
              color: #6b7280;
              min-width: 100px;
              margin-right: 15px;
            }
            .cta-button {
              display: inline-block;
              background: #10b981;
              color: white;
              text-decoration: none;
              padding: 10px 25px;
              border-radius: 8px;
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              margin: 10px 10px;
            }
            .calendar-button {
              display: inline-block;
              background: #6366f1;
              color: white;
              text-decoration: none;
              padding: 10px 25px;
              border-radius: 8px;
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              margin: 10px 10px;
            }
            .button-container {
              text-align: center;
              margin: 15px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="business-name">${data.businessName}</div>
            </div>

            <div class="confirmation-box">
              <h2 style="margin: 0;">✅ Appointment Confirmed!</h2>
            </div>

            <p>Hi ${data.customerName},</p>
            
            <p>Your appointment has been successfully booked. Here are the details:</p>

            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">Service:&nbsp;</span>
                <span>${data.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:&nbsp;</span>
                <span>${data.appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:&nbsp;</span>
                <span>${data.appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:&nbsp;</span>
                <span>${data.businessAddress || data.businessName}</span>
              </div>
            </div>

            <p style="text-align: center; margin-bottom: 10px;">
              <strong>Please confirm your appointment by clicking the button below:</strong>
            </p>

            <div class="button-container">
              <a href="${data.confirmationLink}" class="cta-button">
                ✓ Confirm Appointment
              </a>
              <a href="${generateCalendarLink(data)}" class="calendar-button">
                📅 Add to Calendar
              </a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 10px;">
              If you need to reschedule or cancel, please contact us as soon as possible.
            </p>

            <div class="footer">
              <p>Thank you for choosing ${data.businessName}!</p>
              <p style="font-size: 12px; margin-top: 10px;">
                If you're having trouble clicking the button, copy and paste this link into your browser:<br>
                ${data.confirmationLink}
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${data.customerName},

Your appointment has been successfully booked!

APPOINTMENT DETAILS:
Service: ${data.serviceName}
Date: ${data.appointmentDate}
Time: ${data.appointmentTime}
Location: ${data.businessAddress || data.businessName}

Please confirm your appointment by clicking this link:
${data.confirmationLink}

If you need to reschedule or cancel, please contact us as soon as possible.

Thank you for choosing ${data.businessName}!
    `
  }
}

// Helper function to generate calendar link
function generateCalendarLink(data: {
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  businessName: string
  businessAddress?: string
}) {
  // Parse date and time to create proper datetime for calendar
  const [day, month, year] = data.appointmentDate.split('/')
  const [hours, minutes] = data.appointmentTime.split(':')
  
  // Create date objects for start and end time (assuming 1 hour duration)
  const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes))
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // Add 1 hour
  
  // Format dates for Google Calendar (YYYYMMDDTHHmmss)
  const formatDate = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}${m}${d}T${h}${min}00`
  }
  
  const startDateStr = formatDate(startDate)
  const endDateStr = formatDate(endDate)
  
  // Create Google Calendar link
  const title = encodeURIComponent(`${data.serviceName} - ${data.businessName}`)
  const details = encodeURIComponent(`Appointment for ${data.serviceName} at ${data.businessName}`)
  const location = encodeURIComponent(data.businessAddress || data.businessName)
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}&location=${location}`
}

export function getReviewRequestEmailTemplate(data: {
  customerName: string
  businessName: string
  serviceName: string
  appointmentDate: string
  reviewLink: string
}) {
  return {
    subject: `How was your experience at ${data.businessName}?`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Review Request</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              padding: 30px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .business-name {
              color: #2563eb;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .stars {
              text-align: center;
              margin: 30px 0;
            }
            .star {
              display: inline-block;
              width: 40px;
              height: 40px;
              margin: 0 5px;
            }
            .service-details {
              background: #f3f4f6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              margin: 10px 0;
            }
            .detail-label {
              font-weight: bold;
              color: #6b7280;
            }
            .cta-button {
              display: block;
              background: #10b981;
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 8px;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin: 30px auto;
              max-width: 300px;
            }
            .cta-button:hover {
              background: #059669;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="business-name">${data.businessName}</div>
              <p style="color: #6b7280; font-size: 16px;">Thank you for choosing us!</p>
            </div>

            <p>Hi ${data.customerName},</p>
            
            <p>We hope you enjoyed your recent visit to ${data.businessName}. Your feedback is important to us and helps us improve our services.</p>

            <div class="service-details">
              <div class="detail-row">
                <span class="detail-label">Service:</span> ${data.serviceName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span> ${data.appointmentDate}
              </div>
            </div>

            <div class="stars">
              <p style="font-size: 18px; margin-bottom: 15px;">How would you rate your experience?</p>
              <div>
                ⭐ ⭐ ⭐ ⭐ ⭐
              </div>
            </div>

            <a href="${data.reviewLink}" class="cta-button">
              Leave Your Review
            </a>

            <p style="text-align: center; color: #6b7280;">
              It only takes a minute and helps other customers make informed decisions.
            </p>

            <div class="footer">
              <p>Thank you for your time!</p>
              <p>${data.businessName}</p>
              <p style="font-size: 12px; margin-top: 10px;">
                If you're having trouble clicking the button, copy and paste this link into your browser:<br>
                ${data.reviewLink}
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${data.customerName},

Thank you for choosing ${data.businessName}!

We hope you enjoyed your recent visit. Your feedback is important to us and helps us improve our services.

Service: ${data.serviceName}
Date: ${data.appointmentDate}

Please take a moment to share your experience:
${data.reviewLink}

Thank you for your time!
${data.businessName}
    `
  }
}