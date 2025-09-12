import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessId,
      serviceType,
      description,
      address,
      preferredContact,
      customerName,
      customerEmail,
      customerPhone,
    } = body || {}

    if (!businessId || !serviceType || !description || !customerName || !customerEmail) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, email: true, tenantId: true }
    })
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    // Optional: link to existing customer by email (same-tenant)
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: customerEmail.toLowerCase(), tenantId: business.tenantId },
      select: { id: true }
    })

    const created = await prisma.projectRequest.create({
      data: {
        tenantId: business.tenantId,
        businessId: business.id,
        customerId: existingCustomer?.id || null,
        customerName,
        customerEmail: customerEmail.toLowerCase(),
        customerPhone: customerPhone || null,
        serviceType,
        description,
        address: address || null,
        preferredContact: preferredContact || 'WHATSAPP',
        status: 'NEW'
      }
    })

    // Notify business by email if configured
    if (business.email) {
      const when = new Date().toLocaleString()
      const html = `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:16px;">
          <h2 style="margin:0 0 8px 0">Nueva solicitud de proyecto</h2>
          <p><strong>Negocio:</strong> ${business.name}</p>
          <ul>
            <li><strong>Cliente:</strong> ${customerName} (${customerEmail}${customerPhone ? ' • ' + customerPhone : ''})</li>
            <li><strong>Servicio:</strong> ${serviceType}</li>
            <li><strong>Preferencia de contacto:</strong> ${preferredContact || 'WHATSAPP'}</li>
            <li><strong>Dirección:</strong> ${address || 'No indicada'}</li>
            <li><strong>Fecha:</strong> ${when}</li>
          </ul>
          <p><strong>Descripción:</strong></p>
          <p style="white-space:pre-wrap;">${description}</p>
          <hr/>
          <p style="color:#666">Este es un mensaje automático.</p>
        </div>
      `
      await sendEmail({
        to: business.email,
        subject: `Nueva solicitud de proyecto - ${business.name}`,
        html,
        text: `Nueva solicitud de proyecto\nCliente: ${customerName} (${customerEmail}${customerPhone ? ' • ' + customerPhone : ''})\nServicio: ${serviceType}\nContacto: ${preferredContact || 'WHATSAPP'}\nDirección: ${address || 'No indicada'}\nDescripción: ${description}`
      })
    }

    return NextResponse.json({ success: true, request: { id: created.id } })
  } catch (e) {
    console.error('Error creating project request:', e)
    return NextResponse.json({ error: 'Error creando solicitud' }, { status: 500 })
  }
}

