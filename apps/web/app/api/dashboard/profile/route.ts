import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentUser, createAuthResponse } from '@/lib/auth-utils'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  lastName: z.string().min(1).max(100).optional(),
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
      lastName: (user as any).lastName || null,
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
        lastName: validated.lastName ?? null,
        email: validated.email,
        phone: validated.phone,
        language: validated.language,
        avatar: validated.avatar
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        language: true,
        avatar: true,
        tenantId: true
      }
    })

    // Si el usuario es el dueño del negocio, sincronizar su avatar con el staff
    if (validated.avatar !== undefined || validated.name !== user.name) {
      // Buscar el negocio del usuario
      const business = await prisma.business.findFirst({
        where: {
          tenantId: updatedUser.tenantId
        }
      })

      if (business) {
        // Actualizar el staff que corresponde al dueño
        // (usualmente el staff con el mismo nombre que el usuario)
        await prisma.staff.updateMany({
          where: {
            businessId: business.id,
            OR: [
              { name: user.name }, // Nombre anterior
              { name: validated.name } // Nombre nuevo
            ]
          },
          data: {
            name: validated.name,
            photo: validated.avatar
          }
        })
      }
    }

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      language: updatedUser.language,
      avatar: updatedUser.avatar
    })
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
