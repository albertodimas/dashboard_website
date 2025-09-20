'use client'

import { logger } from '@/lib/logger'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Lock, Mail, ArrowRight, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function ClientLoginPage() {
  return (
    <Suspense fallback={<ClientLoginFallback />}>
      <ClientLoginContent />
    </Suspense>
  )
}

function ClientLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLogin, setIsLogin] = useState(true)
  const [returnUrl, setReturnUrl] = useState('/')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    lastName: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const verified = searchParams.get('verified')
    if (verified === 'true') {
      setSuccessMessage('¡Tu email ha sido verificado exitosamente! Ahora puedes iniciar sesión.')
      setIsLogin(true)
    }

    const from = searchParams.get('from')
    if (from) {
      setReturnUrl(decodeURIComponent(from))
    } else if (typeof window !== 'undefined' && document.referrer) {
      const referrerUrl = new URL(document.referrer)
      if (referrerUrl.hostname === window.location.hostname) {
        setReturnUrl(document.referrer)
      }
    }
  }, [searchParams])

  useEffect(() => {
    const auth = searchParams.get('auth')
    if (auth === 'invalid') {
      setError('Tu sesión anterior expiró o no es válida. Inicia sesión nuevamente.')
    }
  }, [searchParams])

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
    setFormData({ ...formData, password })
    if (!isLogin) {
      setPasswordErrors(validatePassword(password))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!isLogin) {
      const pwdErrors = validatePassword(formData.password)
      if (pwdErrors.length > 0) {
        setError('La contraseña no cumple con los requisitos de seguridad')
        setPasswordErrors(pwdErrors)
        setIsLoading(false)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden')
        setIsLoading(false)
        return
      }
    }

    try {
      let businessSlug: string | undefined
      const from = searchParams.get('from')
      if (from) {
        const decodedFrom = decodeURIComponent(from)
        logger.info('[Cliente Login] From URL:', decodedFrom)

        const extractSlugFromPath = (path: string): string | undefined => {
          const bizMatch = path.match(/\/(?:business|b)\/([^\/\?#]+)/)
          if (bizMatch && bizMatch[1]) return bizMatch[1]
          const dirMatch = path.match(/^\/([^\/\?#]+)/)
          if (dirMatch && dirMatch[1] !== 'cliente') return dirMatch[1]
          return undefined
        }

        if (decodedFrom.includes('://')) {
          const url = new URL(decodedFrom)
          businessSlug = extractSlugFromPath(url.pathname)
        } else if (decodedFrom.startsWith('/')) {
          businessSlug = extractSlugFromPath(decodedFrom)
        } else {
          businessSlug = decodedFrom
        }
      }

      if (isLogin) {
        const response = await fetch('/api/cliente/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            businessSlug
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'No se pudo iniciar sesión')
        }

        if (businessSlug) {
          router.push(`/${businessSlug}`)
        } else {
          router.push(returnUrl)
        }
      } else {
        const response = await fetch('/api/cliente/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            businessSlug
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'No se pudo crear la cuenta')
        }

        setSuccessMessage('Cuenta creada con éxito. Revisa tu email para confirmar tu cuenta.')
        setIsLogin(true)
        setFormData({
          email: formData.email,
          password: '',
          confirmPassword: '',
          name: '',
          lastName: '',
          phone: ''
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row shadow-xl rounded-3xl overflow-hidden bg-white">
          <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 text-white p-10 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-4">
                {isLogin ? 'Ingresa a tu cuenta' : 'Crea tu cuenta' }
              </h1>
              <p className="text-blue-100 leading-relaxed">
                {isLogin
                  ? 'Accede a tus reservas, paquetes y beneficios personalizados.'
                  : 'Regístrate para gestionar tus reservas, historial y beneficios especiales.'}
              </p>
            </div>
            <div className="mt-10 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={20} />
                </div>
                <p className="text-blue-100 text-sm">Gestiona tus citas fácilmente</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <p className="text-blue-100 text-sm">Tus datos están protegidos</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <p className="text-blue-100 text-sm">Obtén ofertas personalizadas</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 p-10">
            <div className="mb-8">
              <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-600">
                {isLogin ? 'Acceso' : 'Registro'} para clientes
              </div>
              {successMessage && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apellido"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="********"
                    required
                  />
                </div>
                {!isLogin && passwordErrors.length > 0 && (
                  <ul className="mt-2 text-xs text-red-500 space-y-1">
                    {passwordErrors.map(err => (
                      <li key={err}>• {err}</li>
                    ))}
                  </ul>
                )}
                {!isLogin && formData.password && passwordErrors.length === 0 && (
                  <p className="mt-2 text-xs text-green-500 flex items-center">
                    <span className="mr-1">✔</span> Contraseña segura
                  </p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="********"
                      required
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-2 text-xs text-red-500">Las contraseñas no coinciden</p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="mt-2 text-xs text-green-500 flex items-center">
                      <span className="mr-1">✔</span> Las contraseñas coinciden
                    </p>
                  )}
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1234567890"
                  />
                </div>
              )}

              {error && (
                <>
                  <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg text-sm mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-red-600 font-medium">{error}</p>
                      </div>
                    </div>
                  </div>
                  {isLogin && (error.toLowerCase().includes('credenciales') || error.toLowerCase().includes('contraseña') || error.toLowerCase().includes('bloqueada')) && (
                    <div className="text-right mb-4">
                      <Link href="/cliente/forgot-password" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    <ArrowRight className="ml-2" size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                    setPasswordErrors([])
                    setFormData({
                      email: '',
                      password: '',
                      confirmPassword: '',
                      name: '',
                      lastName: '',
                      phone: ''
                    })
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href={returnUrl} className="text-gray-500 hover:text-gray-700 text-sm">
                ← Volver
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClientLoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-600">
      <span>Cargando...</span>
    </div>
  )
}
