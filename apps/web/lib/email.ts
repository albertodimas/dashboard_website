import { logger } from './logger'
import { Resend } from 'resend'
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  attachments,
}: {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>
}) {
  const nodemailer = require('nodemailer')

  // Prefer Resend if configured (works in dev/prod)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const normalizeFrom = (v?: string) => {
        if (!v) return undefined
        const trimmed = v.trim()
        // Strip wrapping quotes if present: "Name <email>"
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return trimmed.slice(1, -1)
        }
        return trimmed
      }
      const fromEnv = normalizeFrom(process.env.RESEND_FROM_EMAIL)
      const fromEmail = normalizeFrom(from) || fromEnv || 'onboarding@resend.dev'

      const payload: any = {
        from: fromEmail,
        to,
        subject,
        html,
        attachments: attachments?.map((a) => ({
          filename: a.filename,
          // Resend accepts Buffer; convert strings to Buffer for safety
          content: typeof a.content === 'string' ? Buffer.from(a.content) : a.content,
        })),
      }
      if (text) payload.text = text
      const result = await resend.emails.send(payload)

      // Newer SDKs return { data, error }; handle both patterns defensively
      const anyRes: any = result as any
      const err = anyRes?.error
      if (err) throw err

      logger.info('Email sent via Resend')
      logger.info('To:', to)
      logger.info('Subject:', subject)

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      logger.error('Failed to send via Resend', error)
      // Fall through to SMTP/MailHog as a fallback
    }
  }
  
  // For development, check if we have Gmail credentials first
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    // Only use MailHog if no Gmail credentials are configured
    try {
      const transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
      })
      
      const info = await transporter.sendMail({
        from: from || process.env.EMAIL_FROM || '"Dashboard" <noreply@localhost>',
        to,
        subject,
        html,
        text,
        attachments,
      })

      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.info('✅ Email sent to MailHog!')
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.info('To:', to)
      logger.info('Subject:', subject)
      logger.info('View at: http://localhost:8025')
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return {
        success: true,
        data: info
      }
    } catch (error) {
      logger.error('Error sending to MailHog:', error)
      // Fall through to check for production credentials
    }
  }
  
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.info('📧 EMAIL NOT SENT (Gmail not configured)')
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.info('To:', to)
    logger.info('Subject:', subject)
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.info('\n⚠️ Email credentials not found in .env.local')
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    return {
      success: false,
      message: 'Email service not configured'
    }
  }

  try {
    // Create transporter with Gmail configuration
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
    
    // Verify transporter configuration
    await transporter.verify()
    
    // Send email
    const info = await transporter.sendMail({
      from: from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text,
      attachments,
    })

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.info('✅ Email sent successfully!')
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.info('To:', to)
    logger.info('Subject:', subject)
    logger.info('Message ID:', info.messageId)
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return {
      success: true,
      data: info
    }
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('❌ Failed to send email')
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.error('Error:', error)
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return {
      success: false,
      error
    }
  }
}

// Plantilla para código de verificación
export function getVerificationEmailTemplate(code: string, type: 'verification' | 'reset') {
  const isVerification = type === 'verification'
  
  return {
    subject: isVerification ? 'Verifica tu cuenta' : 'Restablecer contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">
            ${isVerification ? 'Verificación de Email' : 'Restablecer Contraseña'}
          </h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            ${isVerification 
              ? 'Gracias por registrarte. Para completar tu registro, por favor ingresa el siguiente código:' 
              : 'Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:'}
          </p>
          
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px; border: 2px dashed #667eea;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">
              ${code}
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
    `,
    text: `
      ${isVerification ? 'Verificación de Email' : 'Restablecer Contraseña'}
      
      ${isVerification 
        ? 'Gracias por registrarte. Para completar tu registro, por favor ingresa el siguiente código:' 
        : 'Has solicitaste restablecer tu contraseña. Utiliza el siguiente código para continuar:'}
      
      Código: ${code}
      
      Este código expirará en 15 minutos.
      
      Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
    `
  }
}

// Generar código de 6 dígitos
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
