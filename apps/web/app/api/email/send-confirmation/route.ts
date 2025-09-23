import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

interface AppointmentDetails {
  id: string
  customerName: string
  customerEmail: string
  service: string
  date: string
  time: string
  price: number
  businessName: string
  businessAddress?: string
  businessPhone?: string
  language?: 'en' | 'es'
}

function generateICSFile(appointment: AppointmentDetails): string {
  const [year, month, day] = appointment.date.split('-').map(Number)
  const [hours, minutes] = appointment.time.split(':').map(Number)
  const startDate = new Date(year, month - 1, day, hours, minutes, 0)
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
  const formatDateLocal = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')
    return `${y}${m}${d}T${hh}${mm}${ss}`
  }
  const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Nexodash//Appointment//EN\nCALSCALE:GREGORIAN\nMETHOD:REQUEST\nBEGIN:VEVENT\nUID:${Date.now()}@nexodash.com\nDTSTART:${formatDateLocal(startDate)}\nDTEND:${formatDateLocal(endDate)}\nSUMMARY:${appointment.service} - ${appointment.businessName}\nDESCRIPTION:Appointment for ${appointment.service} at ${appointment.businessName}\nLOCATION:${appointment.businessAddress || appointment.businessName}\nSTATUS:CONFIRMED\nSEQUENCE:0\nEND:VEVENT\nEND:VCALENDAR`
  return icsContent
}

function generateEmailHTML(appointment: AppointmentDetails, confirmationUrl: string): string {
  const isEnglish = /^en$/i.test(appointment.language || '')
  const title = isEnglish ? 'Appointment Scheduled!' : 'Cita agendada'
  const confirmRequired = isEnglish ? 'Confirmation Required' : 'Confirmación requerida'
  const confirmMessage = isEnglish ? 'Please confirm your attendance by clicking the button:' : 'Por favor confirma tu asistencia haciendo clic en el botón:'
  const confirmButton = isEnglish ? 'Confirm' : 'Confirmar'
  const serviceLabel = isEnglish ? 'Service' : 'Servicio'
  const dateLabel = isEnglish ? 'Date' : 'Fecha'
  const timeLabel = isEnglish ? 'Time' : 'Hora'
  const priceLabel = isEnglish ? 'Price' : 'Precio'

  return `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif;">\n<div style="max-width:600px;margin:0 auto">\n  <h1>${title}</h1>\n  <div style="background:#e8f5e9;padding:16px;border-radius:8px;margin:16px 0">\n    <h3 style="margin:0 0 8px 0">${confirmRequired}</h3>\n    <p style="margin:0 0 12px 0">${confirmMessage}</p>\n    <a href="${confirmationUrl}" style="display:inline-block;background:#4caf50;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${confirmButton}</a>\n  </div>\n  <ul>\n    <li><strong>${serviceLabel}:</strong> ${appointment.service}</li>\n    <li><strong>${dateLabel}:</strong> ${appointment.date}</li>\n    <li><strong>${timeLabel}:</strong> ${appointment.time}</li>\n    <li><strong>${priceLabel}:</strong> $${appointment.price}</li>\n  </ul>\n</div>\n</body></html>`
}

export async function POST(request: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === 'development'
    const internalKey = request.headers.get('x-internal-key')
    if (!isDev) {
      const { getAuthFromCookie } = await import('@/lib/jwt-auth')
      const session = await getAuthFromCookie()
      const hasInternal = process.env.INTERNAL_API_KEY && internalKey === process.env.INTERNAL_API_KEY
      if (!session && !hasInternal) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Validate input
    const schema = z.object({
      id: z.string().min(1),
      customerName: z.string().min(1),
      customerEmail: z.string().email(),
      service: z.string().min(1),
      date: z.string().min(1),
      time: z.string().min(1),
      price: z.number().or(z.string().transform((v) => Number(v)).pipe(z.number())),
      businessName: z.string().min(1),
      businessAddress: z.string().optional(),
      businessPhone: z.string().optional(),
      language: z.enum(['en', 'es']).optional(),
    })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const body: AppointmentDetails = parsed.data as unknown as AppointmentDetails

    // Rate limit by IP (10 emails / 5 minutes)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'email:send-confirmation', 10, 60 * 5)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many emails sent', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 300) } }
      )
    }

    const icsContent = generateICSFile(body)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const confirmationUrl = `${baseUrl}/api/confirm-appointment?id=${body.id}`
    const html = generateEmailHTML(body, confirmationUrl)
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@nexodash.com'

    const res = await sendEmail({
      from: `"${body.businessName || 'Nexodash'}" <${fromEmail}>`,
      to: body.customerEmail,
      subject: ({ en: `Appointment Confirmation - ${body.service}`, es: `Confirmación de Cita - ${body.service}` } as Record<string,string>)[(body.language||'en')] || `Appointment Confirmation - ${body.service}`,
      html,
      attachments: [{ filename: 'appointment.ics', content: icsContent, contentType: 'text/calendar' }]
    })

    if (!res.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: (res as any).data?.messageId })
  } catch (error) {
    logger.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
