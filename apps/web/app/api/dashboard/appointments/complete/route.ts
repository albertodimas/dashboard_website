import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentUser } from '@/lib/auth-utils'
import { getReviewRequestEmailTemplate } from '@/lib/email-templates'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { appointmentId } = await request.json()

    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
        business: true,
        review: true
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Verify the user owns this business by checking tenantId
    if (appointment.business.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update appointment status to completed
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    // Generate review link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const reviewLink = `${baseUrl}/review/${appointment.id}`

    // Prepare email data
    const emailData = getReviewRequestEmailTemplate({
      customerName: appointment.customer.name,
      businessName: appointment.business.name,
      serviceName: appointment.service.name,
      appointmentDate: new Date(appointment.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      reviewLink
    })

    // Send the email using our email service
    const emailResult = await sendEmail({
      to: appointment.customer.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    })

    console.log('Review link generated:', reviewLink)

    return NextResponse.json({
      success: true,
      message: 'Appointment marked as completed',
      reviewLink,
      emailSent: emailResult.success,
      emailMessage: emailResult.success 
        ? 'Review request email sent successfully' 
        : 'Email not sent (service not configured). Review link available above.'
    })
  } catch (error) {
    console.error('Error completing appointment:', error)
    return NextResponse.json(
      { error: 'Failed to complete appointment' },
      { status: 500 }
    )
  }
}