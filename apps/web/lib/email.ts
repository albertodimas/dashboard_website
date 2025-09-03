export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  const nodemailer = require('nodemailer')
  
  // For development, use MailHog
  if (process.env.NODE_ENV === 'development') {
    try {
      const transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
      })
      
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Sistema de Reservas" <noreply@localhost>',
        to,
        subject,
        html,
        text,
      })

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ Email sent to MailHog!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('View at: http://localhost:8025')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return {
        success: true,
        data: info
      }
    } catch (error) {
      console.error('Error sending to MailHog:', error)
      // Fall through to check for production credentials
    }
  }
  
  // Check if email credentials are configured for production
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 EMAIL NOT SENT (Gmail not configured)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n⚠️ Email credentials not found in .env.local')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
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
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text,
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Email sent successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Message ID:', info.messageId)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return {
      success: true,
      data: info
    }
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ Failed to send email')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error:', error)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
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
