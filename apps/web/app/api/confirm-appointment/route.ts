import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const appointmentId = searchParams.get('id')
    
    if (!appointmentId) {
      // Redirect to error page
      return NextResponse.redirect(new URL('/confirmation-error', request.url))
    }
    
    // Get appointments from localStorage (in production, this would be from database)
    // Since this is server-side, we'll use a workaround with cookies or redirect with status
    
    // Create a redirect URL with the appointment ID
    const confirmationUrl = new URL('/confirm', request.url)
    confirmationUrl.searchParams.set('id', appointmentId)
    
    // Redirect to client-side confirmation page
    return NextResponse.redirect(confirmationUrl)
    
  } catch (error) {
    console.error('Error confirming appointment:', error)
    return NextResponse.redirect(new URL('/confirmation-error', request.url))
  }
}