import { NextResponse } from 'next/server'

export async function POST() {
  // Crear respuesta de éxito
  const response = NextResponse.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  })

  // Eliminar la cookie estableciendo su maxAge a 0
  response.cookies.set('client-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })

  // También eliminar refresh token
  response.cookies.set('client-refresh-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  })

  return response
}
