import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text, from } = await request.json()

    // Check if we should use test email or real email
    const useTestEmail = process.env.USE_TEST_EMAIL === 'true'
    
    let transporter
    
    if (useTestEmail) {
      // For demo purposes, use Ethereal Email (fake SMTP service)
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransporter({
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
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 500 }
        )
      }
      
      transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      })
    }

    const fromEmail = from || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@dashboard-website.com'
    
    console.log('📧 Internal email API - Sending email to:', to)
    
    const info = await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: subject,
      html: html,
      text: text || '',
    })
    
    console.log('✅ Email sent successfully via internal API:', info.messageId)
    
    // Get preview URL for Ethereal Email (only works with test email)
    const previewUrl = useTestEmail ? nodemailer.getTestMessageUrl(info) : null
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      previewUrl
    })
    
  } catch (error: any) {
    console.error('Internal email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    )
  }
}