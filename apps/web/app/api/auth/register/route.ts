import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@dashboard/db'
import { verifyCode, clearVerificationCode } from '../send-verification/route'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, confirmPassword, name, tenantName, subdomain, businessType, verificationCode } = body

    // Validate input
    if (!email || !password || !name || !verificationCode) {
      return NextResponse.json(
        { error: 'All fields are required including verification code' },
        { status: 400 }
      )
    }

    // Validate verification code
    console.log('[REGISTER] Verifying code for', email, 'with code:', verificationCode)
    const isValidCode = verifyCode(email, verificationCode)
    console.log('[REGISTER] Code validation result:', isValidCode)
    
    if (!isValidCode) {
      // Get stored data for debugging
      const { verificationStore } = require('@/lib/verification-store')
      const stored = verificationStore.get(email)
      console.log('[REGISTER] Stored data for', email, ':', stored)
      
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Additional password validation
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*]/.test(password)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return NextResponse.json(
        { error: 'Password must contain uppercase, lowercase, number and special character' },
        { status: 400 }
      )
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
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
    
    console.log('[REGISTER] Creating tenant with data:', {
      name: tenantName || name + "'s Business",
      subdomain: tenantSubdomain,
      email: email,
      settings: {}
    })
    
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName || name + "'s Business",
        subdomain: tenantSubdomain,
        email: email,
        settings: JSON.parse(JSON.stringify({})),
      },
    })

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        tenantId: tenant.id,
        emailVerified: new Date(), // Mark as verified since they used the code
        isActive: true,
      },
    })

    // Note: Business and Membership models will be created when those tables are added to the schema

    // Clear the verification code after successful registration
    clearVerificationCode(email)

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
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      // Check for Prisma-specific errors
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Email or subdomain is already taken' },
          { status: 400 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}