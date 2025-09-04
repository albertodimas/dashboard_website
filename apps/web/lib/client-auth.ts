import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface ClientTokenPayload {
  customerId: string
  email: string
  name: string
}

export async function generateClientToken(payload: ClientTokenPayload): Promise<string> {
  const token = jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '7d' }
  )
  return token
}

export async function verifyClientToken(token: string): Promise<ClientTokenPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ClientTokenPayload
    return decoded
  } catch (error) {
    return null
  }
}