import { NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true
      }
    })
    
    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}