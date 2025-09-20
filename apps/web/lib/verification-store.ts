import { logger } from './logger'
// SECURITY TODO: Replace in-memory store with persistent storage
// Current implementation uses in-memory storage which is:
// - Lost on server restart
// - Not shared across instances in a scaled deployment
// 
// Recommended solutions:
// 1. Redis with TTL for automatic expiration
// 2. Database table with expiry timestamp and cleanup job
// 3. External service like AWS Cognito or Auth0
//
// Implementation priority: HIGH
// Risk: Memory exhaustion if many codes generated without cleanup

interface VerificationData {
  code: string
  email: string
  expiresAt: Date
  attempts: number
  formData?: any
}

const globalStore = globalThis as typeof globalThis & {
  verificationStore?: VerificationStore
}

class VerificationStore {
  private store: Map<string, VerificationData>
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Reuse existing store if it exists (for hot reload)
    if (globalStore.verificationStore?.store) {
      this.store = globalStore.verificationStore.store
    } else {
      this.store = new Map()
      // Start cleanup interval to remove expired codes
      this.startCleanup()
    }
  }
  
  private startCleanup() {
    // Clean up expired codes every 5 minutes
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        const now = new Date()
        const toDelete: string[] = []
        
        this.store.forEach((data, email) => {
          if (data.expiresAt < now) {
            toDelete.push(email)
          }
        })
        
        toDelete.forEach(email => this.store.delete(email))
        
        if (process.env.NODE_ENV === 'development' && toDelete.length > 0) {
          logger.info(`[STORE] Cleaned up ${toDelete.length} expired codes`)
        }
      }, 5 * 60 * 1000) // 5 minutes
    }
  }
  
  // Store a verification code
  set(email: string, code: string, formData?: any): void {
    const existing = this.store.get(email)
    this.store.set(email, {
      code,
      email,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      attempts: existing ? existing.attempts + 1 : 1,
      formData
    })
    // Log without exposing sensitive data
    if (process.env.NODE_ENV === 'development') {
      logger.info('[STORE] Saved verification code, Total stored:', this.store.size)
    }
  }
  
  // Get a verification code
  get(email: string): VerificationData | null {
    const data = this.store.get(email)
    // Log without exposing sensitive data
    if (process.env.NODE_ENV === 'development') {
      logger.info('[STORE] Retrieving verification code, Total stored:', this.store.size)
    }
    if (!data) return null
    
    // Check if expired
    if (data.expiresAt < new Date()) {
      if (process.env.NODE_ENV === 'development') {
        logger.info('[STORE] Verification code expired')
      }
      this.store.delete(email)
      return null
    }
    
    return data
  }
  
  // Verify a code
  verify(email: string, code: string): boolean {
    const data = this.get(email)
    if (!data) {
      if (process.env.NODE_ENV === 'development') {
        logger.info('[STORE] No verification data found')
      }
      return false
    }
    
    const result = data.code === code
    if (process.env.NODE_ENV === 'development') {
      logger.info('[STORE] Verification result:', result)
    }
    return result
  }
  
  // Clear a verification code
  clear(email: string): void {
    if (process.env.NODE_ENV === 'development') {
      logger.info('[STORE] Clearing verification code')
    }
    this.store.delete(email)
  }
  
  // Check rate limit
  checkRateLimit(email: string): { allowed: boolean; minutesLeft?: number } {
    const data = this.store.get(email)
    if (!data) return { allowed: true }
    
    if (data.attempts >= 3) {
      const minutesLeft = Math.ceil((data.expiresAt.getTime() - Date.now()) / 60000)
      if (minutesLeft > 0) {
        return { allowed: false, minutesLeft }
      }
    }
    
    return { allowed: true }
  }
}

// Create a singleton instance with global persistence
const verificationStoreInstance = globalStore.verificationStore ?? new VerificationStore()
if (!globalStore.verificationStore) {
  globalStore.verificationStore = verificationStoreInstance
}

export const verificationStore = verificationStoreInstance
