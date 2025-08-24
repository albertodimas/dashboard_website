import { NextRequest, NextResponse } from 'next/server'

const nodemailer = require('nodemailer')

export async function GET(request: NextRequest) {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('TESTING EMAIL CONFIGURATION')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('EMAIL_USER:', process.env.EMAIL_USER)
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***configured***' : 'NOT SET')
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST)
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'appointmentlab@gmail.com',
        pass: 'apnx cwmj yujw xkeh' // Your app password
      }
    })
    
    console.log('Verifying transporter configuration...')
    
    // Verify configuration
    await transporter.verify()
    console.log('✅ Transporter verified successfully!')
    
    // Send test email  
    console.log('Sending test email...')
    const info = await transporter.sendMail({
      from: '"Dashboard Test" <appointmentlab@gmail.com>',
      to: 'test@example.com', // Change this to your email
      subject: 'Test Email - Dashboard Review System',
      text: 'This is a test email to verify the email system is working.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email from your Dashboard Review System.</p>
          <p>If you receive this, the email system is working correctly!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Sent from Dashboard Website at ${new Date().toLocaleString()}
          </p>
        </div>
      `
    })
    
    console.log('✅ Email sent successfully!')
    console.log('Message ID:', info.messageId)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      config: {
        user: process.env.EMAIL_USER,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT
      }
    })
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ EMAIL ERROR')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error details:', error.message)
    if (error.code) console.error('Error code:', error.code)
    if (error.response) console.error('SMTP Response:', error.response)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.response
    }, { status: 500 })
  }
}