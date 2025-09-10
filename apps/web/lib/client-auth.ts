import { SignJWT, jwtVerify } from 'jose'

// Require CLIENT_JWT_SECRET or fallback to JWT_SECRET - no defaults for security
const CLIENT_JWT_SECRET = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET
if (!CLIENT_JWT_SECRET) {
  throw new Error('CLIENT_JWT_SECRET or JWT_SECRET environment variable is required')
}
const CLIENT_SECRET_BYTES = new TextEncoder().encode(CLIENT_JWT_SECRET)

export interface ClientTokenPayload {
  customerId: string
  email: string
  name: string
}

export async function generateClientToken(payload: ClientTokenPayload): Promise<string> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(CLIENT_SECRET_BYTES)
  return token
}

export async function verifyClientToken(token: string): Promise<ClientTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, CLIENT_SECRET_BYTES)
    return payload as unknown as ClientTokenPayload
  } catch (error) {
    return null
  }
}
