'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ArrowRight, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    // Obtener datos del cliente del localStorage
    const clientData = localStorage.getItem('clientData')
    if (clientData) {
      const data = JSON.parse(clientData)
      setCustomerId(data.id)
    } else {
      // Si no hay datos, redirigir al login
      router.push('/cliente/login')
    }
  }, [router])

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
        body: JSON.stringify({
          code: verificationCode,
          customerId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar código')
      }

      // Actualizar token y datos en localStorage
      localStorage.setItem('clientToken', data.token)
      localStorage.setItem('clientData', JSON.stringify(data.customer))
      
      setSuccess(true)
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/cliente/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/cliente/auth/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al reenviar código')
      }

      setResendCooldown(60) // 60 segundos de cooldown
      setCode(['', '', '', '', '', ''])
      setError('')
      
      // Focus en el primer input
      const firstInput = document.getElementById('code-0')
      if (firstInput) firstInput.focus()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Email Verificado!
            </h1>
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
              Ingresa el código de 6 dígitos que enviamos a tu correo
            </p>
          </div>

          {/* Code Input */}
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                disabled={isLoading || success}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4 flex items-center">
              <XCircle className="mr-2" size={20} />
              {error}
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isLoading || code.join('').length !== 6}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-4"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                Verificar Código
                <ArrowRight className="ml-2" size={20} />
              </>
            )}
          </button>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">
              ¿No recibiste el código?
            </p>
            <button
              onClick={handleResendCode}
              disabled={isLoading || resendCooldown > 0}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
            >
              <RefreshCw className="mr-1" size={16} />
              {resendCooldown > 0 
                ? `Reenviar en ${resendCooldown}s`
                : 'Reenviar código'}
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 text-center">
              El código expira en 15 minutos. Si no lo encuentras, revisa tu carpeta de spam.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}