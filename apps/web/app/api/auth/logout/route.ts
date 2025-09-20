import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Clear session cookie
  cookies().delete('session')
  
  return NextResponse.json({ success: true })
}