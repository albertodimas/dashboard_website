import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === 'development'
    const internalKey = request.headers.get('x-internal-key')
    if (!isDev) {
      if (!process.env.INTERNAL_API_KEY || internalKey !== process.env.INTERNAL_API_KEY) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { to, subject, html, text, from } = await request.json()
    const result = await sendEmail({ to, subject, html, text, from })
    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
    return NextResponse.json({ success: true, messageId: (result as any).data?.messageId })
  } catch (error: any) {
    console.error('Internal email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'

