import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { trackError } from '@/lib/observability'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import { getClientIP, limitByIP } from '@/lib/rate-limit'

const packagePurchaseSchema = z.object({
  businessId: z.string().uuid(),
  packageId: z.string().uuid(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  paymentMethod: z.enum(['CASH', 'TRANSFER']).default('CASH'),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP: 5 purchases / 10 minutes
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'public:packages:purchase', 5, 60 * 10)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 600) } }
      )
    }
    const body = await request.json()
    console.log('Received package purchase data:', body)
    const validated = packagePurchaseSchema.parse(body)

    // Get package details
    const packageDetails = await prisma.package.findUnique({
      where: { id: validated.packageId },
      include: {
        business: true,
        services: {
          include: {
            service: true
          }
        }
      }
    })

    if (!packageDetails) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Verify package belongs to business
    if (packageDetails.businessId !== validated.businessId) {
      return NextResponse.json(
        { error: 'Invalid package for this business' },
        { status: 400 }
      )
    }

    // Check if package is active
    if (!packageDetails.isActive) {
      return NextResponse.json(
        { error: 'This package is not available' },
        { status: 400 }
      )
    }

    // Create or find customer
    let customer = await prisma.customer.findFirst({
      where: {
        email: validated.customerEmail,
        tenantId: packageDetails.business.tenantId
      }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: packageDetails.business.tenantId,
          name: validated.customerName,
          email: validated.customerEmail,
          phone: validated.customerPhone
        }
      })
    }

    // Check if customer already has an active purchase for this package
    // Solo para información, no bloqueamos la compra
    const existingPurchases = await prisma.packagePurchase.findMany({
      where: {
        packageId: validated.packageId,
        customerId: customer.id,
        status: 'ACTIVE',
        remainingSessions: { gt: 0 }
      }
    })

    // No bloqueamos la compra - los clientes pueden comprar múltiples paquetes
    // para acumular sesiones o aprovechar promociones
    if (existingPurchases.length > 0) {
      console.log(`Cliente ${customer.email} comprando paquete adicional. Ya tiene ${existingPurchases.length} paquete(s) activo(s)`)
    }

    // Calculate expiry date if validity days are set
    let expiryDate = null
    if (packageDetails.validityDays) {
      expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + packageDetails.validityDays)
    }

    // Create the package purchase in PENDING status
    const purchase = await prisma.packagePurchase.create({
      data: {
        tenantId: packageDetails.business.tenantId,
        businessId: validated.businessId,
        packageId: validated.packageId,
        customerId: customer.id,
        totalSessions: packageDetails.sessionCount || 1,
        remainingSessions: packageDetails.sessionCount || 1,
        pricePaid: packageDetails.price,
        expiryDate: expiryDate,
        status: 'PENDING', // Estado pendiente hasta confirmar pago
        paymentMethod: validated.paymentMethod,
        paymentStatus: 'PENDING', // Pago pendiente
        notes: validated.notes
      }
    })

    // Send pending reservation email
    try {
      const paymentInstructions = validated.paymentMethod === 'TRANSFER' 
        ? `
          <h3>Instrucciones de Pago por Transferencia:</h3>
          <p>Por favor realiza la transferencia a los siguientes datos y envía el comprobante:</p>
          <ul>
            <li>Contacta al negocio para obtener los datos bancarios</li>
            <li>Monto a transferir: <strong>$${packageDetails.price}</strong></li>
            <li>Concepto: Paquete ${packageDetails.name} - ${customer.name}</li>
          </ul>
        `
        : `
          <h3>Pago en Efectivo:</h3>
          <p>Acércate al negocio para realizar el pago en efectivo.</p>
          <p>Monto a pagar: <strong>$${packageDetails.price}</strong></p>
        `

      const emailHtml = `
        <h2>¡Reserva de Paquete Pendiente de Pago!</h2>
        <p>Hola ${validated.customerName},</p>
        <p>Tu reserva del paquete <strong>${packageDetails.name}</strong> ha sido registrada y está <strong>pendiente de pago</strong>.</p>
        
        <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #92400E; margin: 0;"><strong>⚠️ Importante:</strong> Tu paquete será activado una vez confirmemos tu pago.</p>
        </div>
        
        ${paymentInstructions}
        
        <h3>Detalles del Paquete Reservado:</h3>
        <ul>
          <li><strong>Paquete:</strong> ${packageDetails.name}</li>
          <li><strong>Precio:</strong> $${packageDetails.price}</li>
          <li><strong>Sesiones incluidas:</strong> ${packageDetails.sessionCount || 1}</li>
          ${packageDetails.validityDays ? `<li><strong>Validez:</strong> ${packageDetails.validityDays} días (desde la activación)</li>` : ''}
          <li><strong>Método de pago:</strong> ${validated.paymentMethod === 'TRANSFER' ? 'Transferencia Bancaria' : 'Efectivo'}</li>
        </ul>
        
        <h3>Servicios que incluirá:</h3>
        <ul>
          ${packageDetails.services.map(ps => 
            `<li>${ps.service.name} (${ps.quantity} ${ps.quantity > 1 ? 'sesiones' : 'sesión'})</li>`
          ).join('')}
        </ul>
        
        <p>Una vez confirmado tu pago, recibirás un correo de confirmación y podrás agendar tus citas.</p>
        
        <p>Si tienes dudas, contacta directamente al negocio:</p>
        <ul>
          <li><strong>${packageDetails.business.name}</strong></li>
          ${packageDetails.business.phone ? `<li>Teléfono: ${packageDetails.business.phone}</li>` : ''}
          ${packageDetails.business.email ? `<li>Email: ${packageDetails.business.email}</li>` : ''}
        </ul>
        
        <p>Saludos,<br>${packageDetails.business.name}</p>
      `

      await sendEmail({
        to: validated.customerEmail,
        subject: `Reserva Pendiente de Pago - ${packageDetails.name}`,
        html: emailHtml
      })
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
      // Continue even if email fails
    }

    return NextResponse.json({ 
      success: true, 
      purchaseId: purchase.id,
      status: 'PENDING',
      message: 'Reserva de paquete registrada. Pendiente de confirmación de pago.',
      paymentMethod: validated.paymentMethod
    })
  } catch (error) {
    trackError(error, { route: 'public/packages/purchase' })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to purchase package. Please try again.' },
      { status: 500 }
    )
  }
}
