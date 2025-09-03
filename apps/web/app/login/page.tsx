'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const registered = searchParams.get('registered') === 'true'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Login successful, redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex justify-end p-4">
        <LanguageSelector />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 px-4">
          <div>
            <Link href="/" className="text-2xl font-bold text-center block">
              {t('dashboard')}
            </Link>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {t('signIn')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {t('signInSubtitle')}
            </p>
          </div>

          {registered && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              Account created successfully! Please sign in.
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 px-4 py-3 rounded">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-red-600 font-medium">{error}</p>
                    {(error.toLowerCase().includes('invalid') || error.toLowerCase().includes('password') || error.toLowerCase().includes('failed')) && (
                      <div className="mt-2 text-red-600">
                        <p className="text-sm">Need help?</p>
                        <div className="mt-1 flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <Link href="/forgot-password" className="text-red-700 font-semibold underline hover:text-red-800 text-sm">
                            → Forgot password?
                          </Link>
                          <Link href="/register" className="text-red-700 font-semibold underline hover:text-red-800 text-sm">
                            → Create new account
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  {t('emailAddress')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder={t('emailAddress')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  {t('password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? t('loading') : t('signInBtn')}
              </button>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                {t('dontHaveAccount')}{' '}
                <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  {t('signUp')}
                </Link>
              </span>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">{t('demoAccounts')}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>{t('owner')}:</strong> owner@luxurycuts.com / password123
                </p>
                <p>
                  <strong>{t('owner')}:</strong> owner@glamournails.com / password123
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}