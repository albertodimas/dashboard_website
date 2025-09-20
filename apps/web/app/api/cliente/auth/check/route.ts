import { NextRequest, NextResponse } from 'next/server'
import { verifyClientToken } from '@/lib/client-auth'
import { prisma } from '@dashboard/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Obtener token de las cookies
    const token = request.cookies.get('client-token')?.value
    
    if (!token) {
      return NextResponse.json({ 
        authenticated: false,
        customer: null 
      })
    }
    
    // Verificar el token
    const payload = await verifyClientToken(token)
    
    if (!payload) {
      return NextResponse.json({ 
        authenticated: false,
        customer: null 
      })
    }
    
    // Obtener datos actualizados del cliente
    const customer = await prisma.customer.findUnique({
      where: { id: payload.customerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        // registeredBusinesses was removed; include fields as needed
      }
    })
    
    if (!customer) {
      return NextResponse.json({ 
        authenticated: false,
        customer: null 
      })
    }
    
    return NextResponse.json({
      authenticated: true,
      customer,
      token // Devolver el token para que el frontend pueda usarlo si necesita
    })
    
  } catch (error) {
    logger.error('Error checking auth:', error)
    return NextResponse.json({ 
      authenticated: false,
      customer: null 
    })
  }
}
