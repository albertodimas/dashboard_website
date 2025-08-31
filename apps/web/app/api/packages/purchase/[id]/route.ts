import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@dashboard/db'
import { sendEmail } from '@/lib/email'

// DELETE endpoint para eliminar paquetes pendientes
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
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

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { tenant: true }
    })

    if (!user?.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      )
    }

    // Obtener el paquete comprado
    const packagePurchase = await prisma.packagePurchase.findUnique({
      where: { id: params.id },
      include: {
        package: {
          include: {
            business: true
          }
        },
        customer: true
      }
    })

    if (!packagePurchase) {
      return NextResponse.json(
        { error: 'Package purchase not found' },
        { status: 404 }
      )
    }

    // Verificar que el usuario tenga permisos sobre este negocio
    // Aquí deberías verificar que session.userId es admin del business
    // Por ahora verificamos que el business pertenece al tenant del usuario
    if (packagePurchase.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Solo permitir eliminar paquetes en estado PENDING
    if (packagePurchase.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar paquetes pendientes de pago' },
        { status: 400 }
      )
    }

    // Eliminar el paquete
    await prisma.packagePurchase.delete({
      where: { id: params.id }
    })

    // Enviar email de notificación al cliente
    try {
      const emailHtml = `
        <h2>Reserva de Paquete Cancelada</h2>
        <p>Hola ${packagePurchase.customer.name},</p>
        <p>Tu reserva del paquete <strong>${packagePurchase.package.name}</strong> ha sido cancelada.</p>
        
        <div style="background-color: #FEE2E2; border: 1px solid #F87171; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #991B1B; margin: 0;">
            <strong>Motivo:</strong> No se recibió el pago en el tiempo establecido.
          </p>
        </div>
        
        <p>Si deseas adquirir este paquete, puedes realizar una nueva reserva desde nuestra página web.</p>
        
        <p>Si tienes alguna pregunta, no dudes en contactarnos:</p>
        <ul>
          <li><strong>${packagePurchase.package.business.name}</strong></li>
          ${packagePurchase.package.business.phone ? `<li>Teléfono: ${packagePurchase.package.business.phone}</li>` : ''}
          ${packagePurchase.package.business.email ? `<li>Email: ${packagePurchase.package.business.email}</li>` : ''}
        </ul>
        
        <p>Saludos,<br>${packagePurchase.package.business.name}</p>
      `

      await sendEmail({
        to: packagePurchase.customer.email,
        subject: `Reserva Cancelada - ${packagePurchase.package.name}`,
        html: emailHtml
      })
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError)
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Paquete pendiente eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting package purchase:', error)
    return NextResponse.json(
      { error: 'Failed to delete package purchase' },
      { status: 500 }
    )
  }
}

// PATCH endpoint para actualizar el estado del paquete (confirmar pago)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
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

    const body = await request.json()
    const { action } = body

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { tenant: true }
    })

    if (!user?.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      )
    }

    // Obtener el paquete comprado
    const packagePurchase = await prisma.packagePurchase.findUnique({
      where: { id: params.id },
      include: {
        package: {
          include: {
            business: true,
            services: {
              include: {
                service: true
              }
            }
          }
        },
        customer: true
      }
    })

    if (!packagePurchase) {
      return NextResponse.json(
        { error: 'Package purchase not found' },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (packagePurchase.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Acción: Confirmar pago
    if (action === 'confirm_payment') {
      // Solo permitir confirmar paquetes pendientes
      if (packagePurchase.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Este paquete no está pendiente de pago' },
          { status: 400 }
        )
      }

      // Calcular fecha de expiración desde la activación
      let expiryDate = null
      if (packagePurchase.package.validityDays) {
        expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + packagePurchase.package.validityDays)
      }

      // Actualizar el paquete a ACTIVE
      const updatedPurchase = await prisma.packagePurchase.update({
        where: { id: params.id },
        data: {
          status: 'ACTIVE',
          paymentStatus: 'PAID', // Usar PAID en lugar de COMPLETED
          expiryDate: expiryDate, // Actualizar fecha de expiración
          purchaseDate: new Date() // Actualizar fecha de compra a la confirmación
        }
      })

      // Enviar email de confirmación al cliente
      try {
        const emailHtml = `
          <h2>¡Paquete Activado!</h2>
          <p>Hola ${packagePurchase.customer.name},</p>
          <p>¡Excelentes noticias! Tu pago ha sido confirmado y tu paquete <strong>${packagePurchase.package.name}</strong> ya está activo.</p>
          
          <div style="background-color: #D1FAE5; border: 1px solid #10B981; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #064E3B; margin: 0;">
              <strong>✅ Paquete Activo</strong><br>
              Ya puedes comenzar a usar tus sesiones
            </p>
          </div>
          
          <h3>Detalles de tu Paquete:</h3>
          <ul>
            <li><strong>Paquete:</strong> ${packagePurchase.package.name}</li>
            <li><strong>Sesiones disponibles:</strong> ${packagePurchase.totalSessions}</li>
            ${expiryDate ? `<li><strong>Válido hasta:</strong> ${expiryDate.toLocaleDateString()}</li>` : ''}
            <li><strong>Estado:</strong> ✅ Activo</li>
          </ul>
          
          <h3>Servicios incluidos:</h3>
          <ul>
            ${packagePurchase.package.services.map(ps => 
              `<li>${ps.service.name} (${ps.quantity} ${ps.quantity > 1 ? 'sesiones' : 'sesión'})</li>`
            ).join('')}
          </ul>
          
          <p><strong>¡Ya puedes agendar tus citas!</strong></p>
          <p>Visita nuestra página web o contáctanos directamente para reservar tus sesiones.</p>
          
          <p>Gracias por tu preferencia.</p>
          
          <p>Saludos,<br>${packagePurchase.package.business.name}</p>
        `

        await sendEmail({
          to: packagePurchase.customer.email,
          subject: `¡Paquete Activado! - ${packagePurchase.package.name}`,
          html: emailHtml
        })
      } catch (emailError) {
        console.error('Error sending activation email:', emailError)
        // Continue even if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Pago confirmado y paquete activado',
        purchase: updatedPurchase
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating package purchase:', error)
    return NextResponse.json(
      { error: 'Failed to update package purchase' },
      { status: 500 }
    )
  }
}