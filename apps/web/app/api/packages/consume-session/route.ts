import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@dashboard/db'
import { z } from 'zod'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

    const bodySchema = z.object({ purchaseId: z.string().uuid(), appointmentId: z.string().uuid() })
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { purchaseId, appointmentId } = parsed.data

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get the purchase
      const purchase = await tx.packagePurchase.findUnique({
        where: { id: purchaseId },
        include: {
          package: true
        }
      })

      if (!purchase) {
        throw new Error('Purchase not found')
      }

      // Check if purchase is still active
      if (purchase.status !== 'ACTIVE') {
        throw new Error('Purchase is not active')
      }

      // Check if purchase has expired
      if (purchase.expiryDate && new Date(purchase.expiryDate) < new Date()) {
        // Mark purchase as expired
        await tx.packagePurchase.update({
          where: { id: purchaseId },
          data: { status: 'EXPIRED' }
        })
        throw new Error('Purchase has expired')
      }

      // Check if there are remaining sessions
      if (purchase.remainingSessions <= 0) {
        throw new Error('No remaining sessions in this package')
      }

      // Check if this appointment already consumed a session
      const existingUsage = await tx.sessionUsage.findFirst({
        where: {
          purchaseId,
          appointmentId
        }
      })

      if (existingUsage) {
        throw new Error('Session already consumed for this appointment')
      }

      // Create session usage record
      const sessionUsage = await tx.sessionUsage.create({
        data: {
          purchaseId,
          appointmentId,
          sessionNumber: purchase.usedSessions + 1,
          usedAt: new Date()
        }
      })

      // Update the purchase
      const updatedPurchase = await tx.packagePurchase.update({
        where: { id: purchaseId },
        data: {
          usedSessions: purchase.usedSessions + 1,
          remainingSessions: purchase.remainingSessions - 1,
          status: purchase.remainingSessions - 1 === 0 ? 'COMPLETED' : 'ACTIVE'
        }
      })

      // Update the appointment to link it with the purchase
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          packagePurchaseId: purchaseId
        }
      })

      return { sessionUsage, updatedPurchase }
    })

    return NextResponse.json({ 
      success: true, 
      sessionUsage: result.sessionUsage,
      purchase: result.updatedPurchase
    })

  } catch (error: any) {
    logger.error('Error consuming session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to consume session' },
      { status: 400 }
    )
  }
}

// Restore a consumed session (e.g., when canceling an appointment)
export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

    const delSchema = z.object({ appointmentId: z.string().uuid() })
    const parsed = delSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { appointmentId } = parsed.data

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find the session usage for this appointment
      const sessionUsage = await tx.sessionUsage.findFirst({
        where: { appointmentId },
        include: {
          purchase: true
        }
      })

      if (!sessionUsage) {
        throw new Error('No session consumption found for this appointment')
      }

      // Delete the session usage record
      await tx.sessionUsage.delete({
        where: { id: sessionUsage.id }
      })

      // Update the purchase
      const updatedPurchase = await tx.packagePurchase.update({
        where: { id: sessionUsage.purchaseId },
        data: {
          usedSessions: sessionUsage.purchase.usedSessions - 1,
          remainingSessions: sessionUsage.purchase.remainingSessions + 1,
          status: 'ACTIVE' // Reactivate if it was completed
        }
      })

      // Remove the package purchase link from the appointment
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          packagePurchaseId: null
        }
      })

      return updatedPurchase
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Session restored successfully',
      purchase: result
    })

  } catch (error: any) {
    logger.error('Error restoring session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to restore session' },
      { status: 400 }
    )
  }
}
