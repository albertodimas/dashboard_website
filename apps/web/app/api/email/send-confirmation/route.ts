import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

interface AppointmentDetails {
  id: string  // Add appointment ID
  customerName: string
  customerEmail: string
  service: string
  date: string
  time: string
  price: number
  businessName: string
  businessAddress?: string
  businessPhone?: string
  language?: 'en' | 'es'  // Add language support
}

// Create ICS calendar file content
function generateICSFile(appointment: AppointmentDetails): string {
  // Parse the date and time correctly
  const [year, month, day] = appointment.date.split('-').map(Number)
  const [hours, minutes] = appointment.time.split(':').map(Number)
  
  // Create date in local timezone
  const startDate = new Date(year, month - 1, day, hours, minutes, 0)
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration
  
  // Format date for ICS file (local time with timezone info)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}${month}${day}T${hours}${minutes}${seconds}`
  }
  
  // Get timezone offset in format like "-0400" or "+0530"
  const getTimezoneOffset = (): string => {
    const offset = new Date().getTimezoneOffset()
    const absOffset = Math.abs(offset)
    const hours = Math.floor(absOffset / 60)
    const minutes = absOffset % 60
    const sign = offset <= 0 ? '+' : '-'
    return `${sign}${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`
  }
  
  const tzOffset = getTimezoneOffset()
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Dashboard Website//Appointment//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VTIMEZONE
TZID:Local
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:${tzOffset}
TZOFFSETTO:${tzOffset}
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:${Date.now()}@dashboard-website.com
DTSTART;TZID=Local:${formatDateLocal(startDate)}
DTEND;TZID=Local:${formatDateLocal(endDate)}
SUMMARY:${appointment.service} - ${appointment.businessName}
DESCRIPTION:Appointment for ${appointment.service} at ${appointment.businessName}
LOCATION:${appointment.businessAddress || appointment.businessName}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${appointment.service} appointment in 1 hour
END:VALARM
END:VEVENT
END:VCALENDAR`

  return icsContent
}

// Generate HTML email template with confirmation link
function generateEmailHTML(appointment: AppointmentDetails, icsContent: string): string {
  const icsBase64 = Buffer.from(icsContent).toString('base64')
  
  // Generate confirmation URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const confirmationUrl = `${baseUrl}/api/confirm-appointment?id=${appointment.id}`
  
  // Determine language (default to Spanish if not specified)
  const isEnglish = appointment.language === 'en'
  
  // Translations
  const texts = {
    title: isEnglish ? 'Appointment Scheduled!' : '¡Cita Agendada!',
    subtitle: isEnglish ? 'Your appointment is pending confirmation' : 'Tu cita está pendiente de confirmación',
    confirmRequired: isEnglish ? '⚠️ Confirmation Required' : '⚠️ Confirmación Requerida',
    confirmMessage: isEnglish ? 'Please confirm your attendance by clicking the button:' : 'Por favor confirma tu asistencia haciendo clic en el botón:',
    confirmButton: isEnglish ? '✓ Confirm' : '✓ Confirmar',
    cantClick: isEnglish ? "If you can't click, copy this link:" : 'Si no puedes hacer clic, copia este enlace:',
    service: isEnglish ? 'Service' : 'Servicio',
    date: isEnglish ? 'Date' : 'Fecha',
    time: isEnglish ? 'Time' : 'Hora',
    price: isEnglish ? 'Price' : 'Precio',
    addToCalendar: isEnglish ? '📅 Add to Calendar' : '📅 Añadir al Calendario',
    autoEmail: isEnglish ? 'This is an automated email. Please do not reply to this message.' : 'Este es un correo automático. Por favor no responda a este mensaje.',
    contactBusiness: isEnglish ? 'If you need to cancel or modify your appointment, please contact the business directly.' : 'Si necesita cancelar o modificar su cita, contacte directamente al negocio.'
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f7f7f7;
    }
    .container {
      background-color: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .confirmation-icon {
      width: 60px;
      height: 60px;
      background-color: #22c55e;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .confirmation-icon svg {
      width: 30px;
      height: 30px;
      fill: white;
    }
    h1 {
      color: #1a1a1a;
      margin: 0;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-top: 10px;
      font-size: 16px;
    }
    .details-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .detail-row {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #4b5563;
      display: inline;
    }
    .detail-value {
      color: #1a1a1a;
      display: inline;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .calendar-button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .calendar-button:hover {
      background-color: #2563eb;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .business-info {
      margin-top: 20px;
      padding: 15px;
      background-color: #eff6ff;
      border-radius: 6px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="confirmation-icon">
        <svg viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
      </div>
      <h1>${texts.title}</h1>
      <p class="subtitle">${texts.subtitle}</p>
    </div>
    
    <div style="background-color: #d4f5d4; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h3 style="color: #2e7d32; margin-top: 0;">${texts.confirmRequired}</h3>
      <p style="margin-bottom: 20px;">${texts.confirmMessage}</p>
      <a href="${confirmationUrl}" style="display: inline-block; background-color: #4caf50; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        ${texts.confirmButton}
      </a>
      <p style="font-size: 12px; color: #666; margin-top: 15px;">
        ${texts.cantClick}<br>
        <span style="color: #2563eb;">${confirmationUrl}</span>
      </p>
    </div>
    
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">${texts.service}: </span>
        <span class="detail-value">${appointment.service}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${texts.date}: </span>
        <span class="detail-value">${appointment.date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${texts.time}: </span>
        <span class="detail-value">${appointment.time}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${texts.price}: </span>
        <span class="detail-value">$${appointment.price}</span>
      </div>
    </div>
    
    <div class="business-info">
      <strong>${appointment.businessName}</strong><br>
      ${appointment.businessAddress ? `📍 ${appointment.businessAddress}<br>` : ''}
      ${appointment.businessPhone ? `📞 ${appointment.businessPhone}` : ''}
    </div>
    
    <div class="button-container">
      <a href="data:text/calendar;base64,${icsBase64}" download="appointment.ics" class="calendar-button">
        ${texts.addToCalendar}
      </a>
    </div>
    
    <div class="footer">
      <p>${texts.autoEmail}</p>
      <p>${texts.contactBusiness}</p>
    </div>
  </div>
</body>
</html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body: AppointmentDetails = await request.json()
    
    console.log('📧 Email API called with:', {
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      service: body.service,
      businessName: body.businessName
    })
    
    // Validate required fields
    if (!body.customerEmail || !body.customerName || !body.service) {
      console.error('Missing required fields:', { 
        customerEmail: !!body.customerEmail, 
        customerName: !!body.customerName, 
        service: !!body.service 
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Generate ICS file content
    const icsContent = generateICSFile(body)
    
    // Generate email HTML
    const emailHTML = generateEmailHTML(body, icsContent)
    
    // Check if we should use test email or real email
    const useTestEmail = process.env.USE_TEST_EMAIL === 'true'
    
    let transporter
    let testAccount
    
    if (useTestEmail) {
      // For demo purposes, use Ethereal Email (fake SMTP service)
      testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
    } else {
      // Use real email service from environment variables
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('Email configuration missing. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env.local')
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 500 }
        )
      }
      
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      })
    }
    
    // Create ICS attachment
    const icsAttachment = {
      filename: 'appointment.ics',
      content: icsContent,
      contentType: 'text/calendar',
    }
    
    // Send email
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@dashboard-website.com'
    console.log('📧 Sending email from:', fromEmail, 'to:', body.customerEmail, 'in language:', body.language || 'es')
    
    // Email subject based on language
    const isEnglish = body.language === 'en'
    const subject = isEnglish 
      ? `Appointment Confirmation - ${body.service}`
      : `Confirmación de Cita - ${body.service}`
    
    const info = await transporter.sendMail({
      from: `"${body.businessName || 'Dashboard Website'}" <${fromEmail}>`,
      to: body.customerEmail,
      subject: subject,
      html: emailHTML,
      attachments: [icsAttachment],
    })
    
    console.log('✅ Email sent successfully:', info.messageId)
    
    // Get preview URL for Ethereal Email (only works with test email)
    const previewUrl = useTestEmail ? nodemailer.getTestMessageUrl(info) : null
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      previewUrl, // Only available with test email
      message: useTestEmail 
        ? 'Test email sent successfully (check preview URL)'
        : 'Email sent successfully to ' + body.customerEmail,
      testMode: useTestEmail
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}