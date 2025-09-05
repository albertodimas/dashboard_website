import jwt from 'jsonwebtoken'

// Require CLIENT_JWT_SECRET or fallback to JWT_SECRET - no defaults for security
const CLIENT_JWT_SECRET = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET
if (!CLIENT_JWT_SECRET) {
  throw new Error('CLIENT_JWT_SECRET or JWT_SECRET environment variable is required')
}

export interface ClientTokenPayload {
  customerId: string
  email: string
  name: string
}

export async function generateClientToken(payload: ClientTokenPayload): Promise<string> {
  const token = jwt.sign(
    payload,
    CLIENT_JWT_SECRET,
    { expiresIn: '7d' }
  )
  return token
}

export async function verifyClientToken(token: string): Promise<ClientTokenPayload | null> {
  try {
    const decoded = jwt.verify(token, CLIENT_JWT_SECRET) as ClientTokenPayload
    return decoded
  } catch (error) {
    return null
  }
}