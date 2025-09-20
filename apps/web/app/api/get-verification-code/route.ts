import { NextRequest, NextResponse } from 'next/server'
import { getCode } from '@/lib/verification-redis'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Restrict endpoint: only available in development or with valid internal key
    const internalKey = request.headers.get('x-internal-key')
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
      if (!process.env.INTERNAL_API_KEY || internalKey !== process.env.INTERNAL_API_KEY) {
        // Hide existence in production
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    
    // Get active code from Redis
    const code = await getCode(email)
    if (!code) {
      return NextResponse.json({ error: 'No valid code found' }, { status: 404 })
    }
    return NextResponse.json({ code })
    
  } catch (error) {
    logger.error('Error getting verification code:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
