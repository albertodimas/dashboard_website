import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@dashboard/db'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find customer by email (and optionally phone for extra verification)
    const customer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(phone ? { phone } : {})
      },
      include: {
        tenant: {
          select: {
            name: true,
            id: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'No account found with this email. Please check your details or contact the business.' },
        { status: 404 }
      )
    }

    // Create session data
    const sessionData = {
      customerId: customer.id,
      customerEmail: customer.email,
      customerName: customer.name,
      tenantId: customer.tenantId,
      type: 'customer'
    }

    // Set session cookie
    const sessionCookie = Buffer.from(JSON.stringify(sessionData)).toString('base64')
    
    cookies().set('customer_session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        tenantName: customer.tenant.name
      }
    })

  } catch (error) {
    logger.error('Customer login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}