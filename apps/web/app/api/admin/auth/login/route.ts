import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Admin credentials (in production, store these securely)
const ADMIN_EMAIL = 'admin@directory.com'
const ADMIN_PASSWORD = 'Admin@2024!' // Change this password!

const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: ADMIN_EMAIL,
        role: 'admin',
        timestamp: Date.now()
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Set cookie for better security
    const response = NextResponse.json({ 
      success: true,
      token,
      message: 'Login successful'
    })

    response.cookies.set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400 // 24 hours
    })

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}