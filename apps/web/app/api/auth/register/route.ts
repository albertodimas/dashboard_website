import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@dashboard/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, businessName, subdomain } = body

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findFirst({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create tenant and user
    const tenantSubdomain = subdomain || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    const tenant = await prisma.tenant.create({
      data: {
        name: businessName || name + "'s Business",
        subdomain: tenantSubdomain,
        email: email,
        settings: {},
      },
    })

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        tenantId: tenant.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}