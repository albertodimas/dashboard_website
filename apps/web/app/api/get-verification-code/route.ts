import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    
    // Find customer
    const customer = await prisma.customer.findFirst({
      where: { email: email.toLowerCase() }
    })
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    // Get the latest verification code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        customerId: customer.id,
        type: 'PASSWORD_RESET',
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (!verificationCode) {
      return NextResponse.json({ error: 'No valid code found' }, { status: 404 })
    }
    
    return NextResponse.json({
      code: verificationCode.code,
      expiresAt: verificationCode.expiresAt
    })
    
  } catch (error) {
    console.error('Error getting verification code:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}