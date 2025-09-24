import { Resend } from 'resend'
import { logger } from './logger'

type Attachment = { filename: string; content: string | Buffer; contentType?: string }

type SendEmailArgs = {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  attachments?: Attachment[]
}

type SendEmailResult = { success: true; data: unknown } | { success: false; error?: unknown; message?: string }

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    logger.error('Resend API key not configured (RESEND_API_KEY)')
    return null
  }
  return new Resend(apiKey)
}

const normalizeFrom = (value?: string): string | undefined => {
  if (!value) return undefined
  const trimmed = value.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

export async function sendEmail({ to, subject, html, text, from, attachments }: SendEmailArgs): Promise<SendEmailResult> {
  const resend = getResendClient()
  if (!resend) {
    return {
      success: false,
      message: 'Resend is not configured',
    }
  }

  const fromEnv = normalizeFrom(process.env.RESEND_FROM_EMAIL)
  const fromEmail = normalizeFrom(from) || fromEnv

  if (!fromEmail) {
    logger.error('Missing RESEND_FROM_EMAIL or explicit "from" when sending email')
    return {
      success: false,
      message: 'Sender email not configured',
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: typeof attachment.content === 'string' ? Buffer.from(attachment.content) : attachment.content,
        contentType: attachment.contentType,
      })),
    })

    if (error) {
      throw error
    }

    logger.info('Email sent via Resend', { to, subject })

    return {
      success: true,
      data,
    }
  } catch (error) {
    logger.error('Failed to send email via Resend', error)
    return {
      success: false,
      error,
    }
  }
}

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
        : 'Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:'}

      Código: ${code}

      Este código expirará en 15 minutos.

      Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
    `,
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
