import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// Require JWT_SECRET to be set - no fallback for security
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export interface JWTPayload {
  userId: string
  email: string
  name: string
  tenantId?: string
  subdomain?: string
  role?: string
  isAdmin?: boolean
  exp?: number
}

export async function createJWT(payload: JWTPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
  
  return token
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export async function setAuthCookie(payload: JWTPayload) {
  const token = await createJWT(payload)
  
  cookies().set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  
  return token
}

export async function getAuthFromCookie(): Promise<JWTPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')
  
  if (!token?.value) {
    return null
  }
  
  return await verifyJWT(token.value)
}

export async function clearAuthCookie() {
  cookies().delete('auth-token')
}