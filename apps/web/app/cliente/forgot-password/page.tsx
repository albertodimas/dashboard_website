'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'success'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    code: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push('Mínimo 8 caracteres')
    if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula')
    if (!/[a-z]/.test(password)) errors.push('Al menos una minúscula')
    if (!/[0-9]/.test(password)) errors.push('Al menos un número')
    if (!/[!@#$%^&*]/.test(password)) errors.push('Al menos un carácter especial (!@#$%^&*)')
    return errors
  }

  const handlePasswordChange = (password: string) => {
    setFormData({...formData, newPassword: password})
    setPasswordErrors(validatePassword(password))
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Si pegan un código completo
      const pastedCode = value.slice(0, 6).split('')
      const newCode = [...formData.code]
      pastedCode.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit
      })
      setFormData({...formData, code: newCode})
      // Focus en el último input
      const lastInput = document.getElementById('code-5')
      if (lastInput) lastInput.focus()
    } else {
      // Input normal
      const newCode = [...formData.code]
      newCode[index] = value
      setFormData({...formData, code: newCode})

      // Auto-focus al siguiente input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`)
        if (nextInput) nextInput.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !formData.code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleSendCode = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          userType: 'cliente' 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar código')
      }

      setStep('code')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = () => {
    const code = formData.code.join('')
    if (code.length !== 6) {
      setError('Por favor ingresa el código completo')
      return
    }
    setError('')
    setStep('password')
  }

  const handleResetPassword = async () => {
    // Validaciones
    const pwdErrors = validatePassword(formData.newPassword)
    if (pwdErrors.length > 0) {
      setError('La contraseña no cumple con los requisitos de seguridad')
      setPasswordErrors(pwdErrors)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code.join(''),
          newPassword: formData.newPassword,
          userType: 'cliente'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al restablecer contraseña')
      }

      // Guardar token y datos en localStorage para auto-login
      localStorage.setItem('clientToken', data.token)
      localStorage.setItem('clientData', JSON.stringify(data.customer))
      
      setStep('success')
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        window.location.href = '/cliente/dashboard'
      }, 3000)
    } catch (err: any) {
      setError(err.message)
      // Si el código es inválido, volver al paso del código
      if (err.message.includes('Código')) {
        setStep('code')
        setFormData({...formData, code: ['', '', '', '', '', '']})
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Contraseña Actualizada!
            </h1>
            <p className="text-gray-600">
              Tu contraseña ha sido restablecida exitosamente. Redirigiendo al dashboard...
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
              <Lock className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 'email' && 'Recuperar Contraseña'}
              {step === 'code' && 'Ingresa el Código'}
              {step === 'password' && 'Nueva Contraseña'}
            </h1>
            <p className="text-gray-600 mt-2">
              {step === 'email' && 'Ingresa tu email para recibir un código de verificación'}
              {step === 'code' && 'Revisa tu email e ingresa el código de 6 dígitos'}
              {step === 'password' && 'Crea una nueva contraseña segura'}
            </p>
          </div>

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={(e) => { e.preventDefault(); handleSendCode(); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Enviar Código
                    <ArrowRight className="ml-2" size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Code */}
          {step === 'code' && (
            <div>
              <div className="flex justify-center gap-2 mb-6">
                {formData.code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    disabled={isLoading}
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyCode}
                disabled={isLoading || formData.code.join('').length !== 6}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Verificar Código
                <ArrowRight className="ml-2" size={20} />
              </button>

              <button
                onClick={() => setStep('email')}
                className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm flex items-center justify-center"
              >
                <ArrowLeft className="mr-1" size={16} />
                Cambiar email
              </button>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
                {passwordErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordErrors.map((err, idx) => (
                      <p key={idx} className="text-xs text-red-500 flex items-center">
                        <span className="mr-1">✗</span> {err}
                      </p>
                    ))}
                  </div>
                )}
                {formData.newPassword && passwordErrors.length === 0 && (
                  <p className="mt-2 text-xs text-green-500 flex items-center">
                    <span className="mr-1">✓</span> Contraseña segura
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                  <p className="mt-2 text-xs text-red-500">Las contraseñas no coinciden</p>
                )}
                {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                  <p className="mt-2 text-xs text-green-500 flex items-center">
                    <span className="mr-1">✓</span> Las contraseñas coinciden
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Restablecer Contraseña
                    <ArrowRight className="ml-2" size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to login link */}
          <div className="mt-6 text-center">
            <Link href="/cliente/login" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}