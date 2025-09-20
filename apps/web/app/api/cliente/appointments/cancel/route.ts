import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { sendEmail } from '@/lib/email'
import { verifyClientToken } from '@/lib/client-auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verificar token
    const token = request.cookies.get('client-token')?.value || 
                  request.headers.get('authorization')?.substring(7)

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = token ? await verifyClientToken(token) : null
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const { appointmentId, reason } = await request.json()

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'ID de cita requerido' },
        { status: 400 }
      )
    }

    // Buscar todos los customers con el mismo email
    const allCustomers = await prisma.customer.findMany({
      where: {
        email: decoded.email
      },
      select: {
        id: true
      }
    })
    
    const customerIds = allCustomers.map(c => c.id)

    // Verificar que la cita pertenece al cliente
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        customerId: {
          in: customerIds
        }
      },
      include: {
        business: {
          select: {
            name: true
          }
        },
        service: {
          select: {
            name: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la cita no esté ya cancelada
    if (appointment.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'La cita ya está cancelada' },
        { status: 400 }
      )
    }

    // Verificar que la cita sea futura (no se pueden cancelar citas pasadas)
    if (new Date(appointment.startTime) < new Date()) {
      return NextResponse.json(
        { error: 'No se pueden cancelar citas pasadas' },
        { status: 400 }
      )
    }

    // Verificar política de cancelación (ejemplo: mínimo 24 horas antes)
    const hoursBeforeAppointment = (new Date(appointment.startTime).getTime() - Date.now()) / (1000 * 60 * 60)
    
    if (hoursBeforeAppointment < 24) {
      // Aún permitir cancelación pero con advertencia
      logger.info(`[Cliente Cancel] Cancelación tardía: ${hoursBeforeAppointment.toFixed(1)} horas antes`)
    }

    // Cancelar la cita
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: appointment.customerId,
        cancellationReason: (typeof reason === 'string' && reason.trim().length > 0)
          ? reason.trim().slice(0, 300)
          : 'Cancelado por el cliente desde el portal'
      }
    })

    // Notificar al negocio por email con la nota (si hay email configurado)
    try {
      const biz = await prisma.business.findUnique({ where: { id: appointment.businessId }, select: { email: true, name: true } })
      if (biz?.email) {
        const reasonText = updatedAppointment.cancellationReason || 'Cancelado por el cliente'
        const serviceName = appointment.service?.name || 'Servicio'
        const when = new Date(appointment.startTime).toLocaleString()
        const customerName = appointment.customer?.name || 'Cliente'
        await sendEmail({
          to: biz.email,
          subject: `Cancelación de cita - ${biz.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:16px;">
              <p>Hola ${biz.name || ''},</p>
              <p>El cliente <strong>${customerName}</strong> ha cancelado la cita:</p>
              <ul>
                <li><strong>Servicio:</strong> ${serviceName}</li>
                <li><strong>Fecha:</strong> ${when}</li>
              </ul>
              <p><strong>Nota del cliente:</strong> ${reasonText}</p>
              <p style="color:#666">Este es un mensaje automático.</p>
            </div>
          `,
          text: `Cancelación de cita - ${biz.name}\nEl cliente ${customerName} ha cancelado la cita:\nServicio: ${serviceName}\nFecha: ${when}\nNota: ${reasonText}`
        })
      }
    } catch (e) {
      logger.warn('[Cliente Cancel] No se pudo enviar email al negocio:', (e as any)?.message || e)
    }
    // Si la cita estaba asociada a un paquete, restaurar la sesión
    if (appointment.packagePurchaseId) {
      await prisma.packagePurchase.update({
        where: { id: appointment.packagePurchaseId },
        data: {
          remainingSessions: {
            increment: 1
          }
        }
      })
      logger.info(`[Cliente Cancel] Sesión restaurada al paquete ${appointment.packagePurchaseId}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Cita cancelada exitosamente',
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        businessName: appointment.business.name,
        serviceName: appointment.service.name,
        startTime: appointment.startTime,
        cancellationReason: updatedAppointment.cancellationReason
      }
    })

  } catch (error) {
    logger.error('Cancel appointment error:', error)
    return NextResponse.json(
      { error: 'Error al cancelar la cita' },
      { status: 500 }
    )
  }
}


