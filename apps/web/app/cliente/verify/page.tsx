'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, ArrowRight, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Verificar si el usuario tiene una sesión activa
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Obtener el ID temporal de la cookie de verificación
      const response = await fetch('/api/cliente/auth/check-verification-pending', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCustomerEmail(data.email)
      } else {
        // Si no hay cookie de verificación pendiente, redirigir al login
        router.push('/cliente/login')
      }
    } catch (error) {
      console.error('Error checking verification status:', error)
      router.push('/cliente/login')
    } finally {
      setCheckingAuth(false)
    }
  }

  useEffect(() => {
    // Cooldown timer para reenviar código
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Si pegan un código completo
      const pastedCode = value.slice(0, 6).split('')
      const newCode = [...code]
      pastedCode.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit
      })
      setCode(newCode)
      // Focus en el último input
      const lastInput = document.getElementById('code-5')
      if (lastInput) lastInput.focus()
    } else {
      // Input normal
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)

      // Auto-focus al siguiente input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`)
        if (nextInput) nextInput.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleVerify = async () => {
    const verificationCode = code.join('')
    if (verificationCode.length !== 6) {
      setError('Por favor ingresa el código completo')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/cliente/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: verificationCode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar código')
      }
      
      setSuccess(true)
      
      // Redirigir al login después de 2 segundos, preservando "from" si existe
      setTimeout(() => {
        const from = searchParams.get('from')
        if (from) {
          router.push(`/cliente/login?verified=true&from=${encodeURIComponent(from)}`)
        } else {
          router.push('/cliente/login?verified=true')
        }
      }, 2000)
    } catch (err: any) {
      setError(err.message)
      // Limpiar el código en caso de error
      setCode(['', '', '', '', '', ''])
      const firstInput = document.getElementById('code-0')
      if (firstInput) firstInput.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/cliente/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al reenviar código')
      }

      setResendCooldown(60) // 60 segundos de cooldown
      setError('') // Limpiar errores
      alert('Código reenviado. Revisa tu email.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Email Verificado!
            </h2>
            <p className="text-gray-600">
              Tu cuenta ha sido verificada exitosamente. Redirigiendo...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
              <Mail className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Verifica tu Email
            </h1>
            <p className="text-gray-600 mt-2">
              Hemos enviado un código de 6 dígitos a:
            </p>
            <p className="font-semibold text-gray-900 mt-1">
              {customerEmail}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ingresa el código de verificación
            </label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isLoading || code.join('').length !== 6}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Verificar Email
                <ArrowRight className="ml-2" size={20} />
              </>
            )}
          </button>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              ¿No recibiste el código?
            </p>
            <button
              onClick={handleResendCode}
              disabled={isLoading || resendCooldown > 0}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 
                ? `Reenviar código en ${resendCooldown}s`
                : 'Reenviar código'}
            </button>
          </div>

          {/* Back to Login */}
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/cliente/login')}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
