// Temporary in-memory store for verification codes
// In production, this should be replaced with Redis or database storage

interface VerificationData {
  code: string
  email: string
  expiresAt: Date
  attempts: number
  formData?: any
}

// Use global variable to persist store across Next.js hot reloads
declare global {
  var verificationStore: VerificationStore | undefined
}

class VerificationStore {
  private store: Map<string, VerificationData>
  
  constructor() {
    // Reuse existing store if it exists (for hot reload)
    if (global.verificationStore?.store) {
      this.store = global.verificationStore.store
    } else {
      this.store = new Map()
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
    console.log('[STORE] Saved code for', email, ':', code, 'Total stored:', this.store.size)
  }
  
  // Get a verification code
  get(email: string): VerificationData | null {
    const data = this.store.get(email)
    console.log('[STORE] Getting code for', email, ':', data ? data.code : 'NOT FOUND', 'Total stored:', this.store.size)
    if (!data) return null
    
    // Check if expired
    if (data.expiresAt < new Date()) {
      console.log('[STORE] Code expired for', email)
      this.store.delete(email)
      return null
    }
    
    return data
  }
  
  // Verify a code
  verify(email: string, code: string): boolean {
    const data = this.get(email)
    if (!data) {
      console.log('[STORE] No data found for verification of', email)
      return false
    }
    
    const result = data.code === code
    console.log('[STORE] Verify', email, 'code:', code, 'stored:', data.code, 'match:', result)
    return result
  }
  
  // Clear a verification code
  clear(email: string): void {
    console.log('[STORE] Clearing code for', email)
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
export const verificationStore = global.verificationStore = new VerificationStore()