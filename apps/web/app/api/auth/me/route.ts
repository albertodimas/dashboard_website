import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Decode session (simplified version)
    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        tenantId: session.tenantId,
        subdomain: session.subdomain || 'dashboard',
        role: session.role,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }
}