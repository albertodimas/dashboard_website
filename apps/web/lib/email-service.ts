// @ts-ignore
const nodemailer = require('./nodemailer-wrapper')
import type { Transporter } from 'nodemailer'

let transporter: Transporter | null = null

export async function getEmailTransporter(): Promise<Transporter> {
  if (transporter) {
    return transporter
  }

  const useTestEmail = process.env.USE_TEST_EMAIL === 'true'

  if (useTestEmail) {
    // For demo purposes, use Ethereal Email (fake SMTP service)
    const testAccount = await nodemailer.createTestAccount()
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
      throw new Error('Email configuration is missing')
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

  return transporter
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const transporter = await getEmailTransporter()
    const fromEmail = options.from || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@dashboard-website.com'
    const useTestEmail = process.env.USE_TEST_EMAIL === 'true'
    
    console.log(`📧 Sending email: ${options.subject} to ${options.to}`)
    
    const info = await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    })
    
    console.log('✅ Email sent successfully:', info.messageId)
    
    // Get preview URL for Ethereal Email (only works with test email)
    const previewUrl = useTestEmail ? nodemailer.getTestMessageUrl(info) : null
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    throw error
  }
}

export function generatePasswordResetEmailHTML(verificationCode: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">
          Restablecer Contraseña
        </h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:
        </p>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px; border: 2px dashed #667eea;">
          <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">
            ${verificationCode}
          </span>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          Este código expirará en <strong>15 minutos</strong>.
        </p>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          Este es un mensaje automático, por favor no respondas a este email.
        </p>
      </div>
    </div>
  `
}

export function generatePasswordResetEmailText(verificationCode: string): string {
  return `
Restablecer Contraseña

Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:

Código: ${verificationCode}

Este código expirará en 15 minutos.

Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
  `
}
