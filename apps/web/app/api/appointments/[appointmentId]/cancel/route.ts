import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nexodash/db'
import jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { 
        id: params.appointmentId 
      },
      include: {
        customer: true
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    // Verify the appointment belongs to the authenticated customer
    if (appointment.customerId !== decoded.customerId) {
      return NextResponse.json(
        { error: 'No autorizado para cancelar esta cita' },
        { status: 403 }
      )
    }

    // Check if appointment can be cancelled (not in the past)
    if (new Date(appointment.startTime) < new Date()) {
      return NextResponse.json(
        { error: 'No se pueden cancelar citas pasadas' },
        { status: 400 }
      )
    }

    // Check if appointment is already cancelled
    if (appointment.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Esta cita ya está cancelada' },
        { status: 400 }
      )
    }

    // Cancel the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.appointmentId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Cancelado por el cliente'
      }
    })

    // If the appointment was using a package session, restore it
    if (appointment.packagePurchaseId) {
      await prisma.packagePurchase.update({
        where: { id: appointment.packagePurchaseId },
        data: {
          remainingSessions: {
            increment: 1
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Cita cancelada exitosamente',
      appointment: updatedAppointment
    })

  } catch (error) {
    logger.error('Cancel appointment error:', error)
    return NextResponse.json(
      { error: 'Error al cancelar la cita' },
      { status: 500 }
    )
  }
}