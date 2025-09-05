import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentUser, createAuthResponse } from '@/lib/auth-utils'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  language: z.enum(['en', 'es']).optional(),
  avatar: z.string().optional()
})

// GET current user profile
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return createAuthResponse('Not authenticated', 401)
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      language: user.language || 'en',
      avatar: user.avatar
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return createAuthResponse('Not authenticated', 401)
    }

    const body = await request.json()
    const validated = profileSchema.parse(body)

    // Check if email is being changed and if it's already in use
    if (validated.email !== user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validated.email,
          id: { not: user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        language: validated.language,
        avatar: validated.avatar
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        language: true,
        avatar: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}