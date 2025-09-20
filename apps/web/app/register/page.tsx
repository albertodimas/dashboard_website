'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    lastName: '',
    tenantName: '',
    subdomain: '',
  })
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [emailStatus, setEmailStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle')
  const [subStatus, setSubStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle')
  const [subSuggestion, setSubSuggestion] = useState<string>('')

  const checkAvailability = async (opts: { email?: string; subdomain?: string }) => {
    const params = new URLSearchParams()
    if (opts.email) params.set('email', opts.email)
    if (opts.subdomain) params.set('subdomain', opts.subdomain)
    const res = await fetch(`/api/auth/check-availability?${params.toString()}`)
    if (!res.ok) return
    const data = await res.json()
    if (typeof data.emailAvailable === 'boolean') {
      setEmailStatus(data.emailAvailable ? 'available' : 'taken')
    }
    if (typeof data.subdomainAvailable === 'boolean') {
      setSubStatus(data.subdomainAvailable ? 'available' : 'taken')
      setSubSuggestion(data.suggestion || '')
    }
  }

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('One number')
    if (!/[!@#$%^&*]/.test(password)) errors.push('One special character (!@#$%^&*)')
    return errors
  }

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password })
    setPasswordErrors(validatePassword(password))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    // quick availability validation before sending code
    if (emailStatus === 'taken') {
      setError('Email is already registered. Please sign in or use another email.')
      return
    }
    if (subStatus === 'taken') {
      setError('Subdomain is already in use. Please choose another.')
      return
    }
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    const errors = validatePassword(formData.password)
    if (errors.length > 0) {
      setError('Password does not meet requirements')
      return
    }

    setLoading(true)

    try {
      // Step 1: Send verification code
      const verifyResponse = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Failed to send verification code')
      }

      // Move to verification step
      setStep('verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Registration in progress
      
      // Complete registration with verification code
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          verificationCode
        }),
      })

      const data = await response.json()
      logger.info('Registration response:', response.status, data)

      if (!response.ok) {
        // Handle backend conflict (409) by returning to the form and marking the field
        if (response.status === 409 && data && typeof data.field === 'string') {
          const field = data.field as 'email' | 'subdomain'
          if (field === 'email') {
            setEmailStatus('taken')
            await checkAvailability({ email: formData.email })
          } else if (field === 'subdomain') {
            setSubStatus('taken')
            await checkAvailability({ subdomain: formData.subdomain })
          }
          setError(data.error || 'A conflict was found. Please update the form.')
          setStep('register')
          setLoading(false)
          return
        }
        const details = typeof data.details === 'string' ? ` (${data.details})` : ''
        throw new Error((data.error || 'Registration failed') + details)
      }

      // Registration successful, redirect to login
      router.push('/login?registered=true')
    } catch (err) {
      logger.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 px-4">
        <div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              sign in to existing account
            </Link>
          </p>
        </div>
        {step === 'register' ? (
          <>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="John"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${emailStatus === 'taken' ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                placeholder="john@example.com"
                value={formData.email}
                onChange={async (e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setEmailStatus('checking')
                  const val = e.target.value
                  if (val && /@/.test(val)) {
                    await checkAvailability({ email: val })
                  } else {
                    setEmailStatus('idle')
                  }
                }}
              />
              {emailStatus === 'checking' && (
                <p className="mt-1 text-xs text-gray-500">Checking email availability…</p>
              )}
              {emailStatus === 'taken' && (
                <p className="mt-1 text-xs text-red-600">Email is already registered. <Link href="/login" className="underline">Sign in</Link> or use another email.</p>
              )}
              {emailStatus === 'available' && (
                <p className="mt-1 text-xs text-green-600">Email available</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
              {formData.password && passwordErrors.length > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  Password needs:
                  <ul className="list-disc list-inside">
                    {passwordErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              {formData.password && passwordErrors.length === 0 && (
                <div className="mt-1 text-xs text-green-600">✓ Strong password</div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                placeholder="Re-type your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div className="mt-1 text-xs text-red-600">Passwords do not match</div>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="mt-1 text-xs text-green-600">✓ Passwords match</div>
              )}
            </div>

            <div>
              <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                id="tenantName"
                name="tenantName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="My Awesome Business"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                Subdomain
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  required
                  pattern="[a-z0-9-]+"
                  className={`flex-1 appearance-none relative block w-full px-3 py-2 border ${subStatus === 'taken' ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-l-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                  placeholder="mybusiness"
                  value={formData.subdomain}
                  onChange={async (e) => {
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    setFormData({ ...formData, subdomain: v })
                    if (v) {
                      setSubStatus('checking')
                      await checkAvailability({ subdomain: v })
                    } else {
                      setSubStatus('idle')
                    }
                  }}
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  .localhost:3000
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Only lowercase letters, numbers, and hyphens
              </p>
              {subStatus === 'checking' && (
                <p className="mt-1 text-xs text-gray-500">Checking subdomain availability…</p>
              )}
              {subStatus === 'taken' && (
                <p className="mt-1 text-xs text-red-600">Subdomain not available{subSuggestion ? ` - try "${subSuggestion}"` : ''}</p>
              )}
              {subStatus === 'available' && (
                <p className="mt-1 text-xs text-green-600">Subdomain available</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={
                loading ||
                emailStatus === 'taken' ||
                subStatus === 'taken' ||
                emailStatus === 'checking' ||
                subStatus === 'checking'
              }
              className="group relative w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {(emailStatus === 'checking' || subStatus === 'checking' || loading) && (
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              {emailStatus === 'checking' || subStatus === 'checking' ? 'Checking availability…' : (loading ? 'Creating account...' : 'Create account')}
            </button>
          </div>

          <div className="text-xs text-gray-600">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </div>
            </form>
            <div className="text-center">
              <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition">
                <span aria-hidden="true">←</span> Volver al inicio
              </Link>
            </div>
          </>
        ) : (
          <>
            <form className="mt-8 space-y-6" onSubmit={handleVerification}>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Verify your email</h3>
            <p className="text-sm text-gray-600 mb-4">
              We&apos;ve sent a verification code to <strong>{formData.email}</strong>
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                maxLength={6}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="mt-6 space-y-4">
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Complete Registration'}
              </button>
              <button
                type="button"
                onClick={() => setStep('register')}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to form
              </button>
            </div>
          </div>
            </form>
            <div className="mt-6 text-center">
              <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition">
                <span aria-hidden="true">←</span> Volver al inicio
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
