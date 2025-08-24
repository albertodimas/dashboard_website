import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getReviewRequestEmailTemplate } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, testEmail, emailData } = body
    
    // Generate email content
    const emailTemplate = getReviewRequestEmailTemplate({
      customerName: emailData.customerName || 'Valued Customer',
      businessName: emailData.businessName || 'Our Business',
      serviceName: emailData.serviceName || 'Service',
      appointmentDate: emailData.appointmentDate || new Date().toLocaleDateString(),
      reviewLink: emailData.reviewLink || `http://localhost:3000/review/${appointmentId}`
    })
    
    // Send email
    const result = await sendEmail({
      to: testEmail || 'test@example.com',
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    })
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Email sent successfully' : 'Failed to send email',
      error: result.success ? null : result.error
    })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email'
    }, { status: 500 })
  }
}