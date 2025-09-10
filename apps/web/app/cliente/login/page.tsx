'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Lock, Mail, ArrowRight, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function ClientLoginPage() {
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
    // Verificar si el usuario acaba de verificar su email
    const verified = searchParams.get('verified')
    if (verified === 'true') {
      setSuccessMessage('¡Tu email ha sido verificado exitosamente! Ahora puedes iniciar sesión.')
      setIsLogin(true)
    }

    // Obtener la URL de retorno desde los parámetros o del referrer
    const from = searchParams.get('from')
    if (from) {
      setReturnUrl(decodeURIComponent(from))
    } else if (typeof window !== 'undefined' && document.referrer) {
      // Si viene de una página del mismo dominio, usar esa como retorno
      const referrerUrl = new URL(document.referrer)
      if (referrerUrl.hostname === window.location.hostname) {
        setReturnUrl(document.referrer)
      }
    }
  }, [searchParams])

  // Si venimos de un token inválido, mostrar mensaje claro
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
    setFormData({...formData, password})
    if (!isLogin) {
      setPasswordErrors(validatePassword(password))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validaciones adicionales para registro
    if (!isLogin) {
      // Validar contraseña fuerte
      const pwdErrors = validatePassword(formData.password)
      if (pwdErrors.length > 0) {
        setError('La contraseña no cumple con los requisitos de seguridad')
        setPasswordErrors(pwdErrors)
        setIsLoading(false)
        return
      }

      // Verificar que las contraseñas coincidan
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden')
        setIsLoading(false)
        return
      }
    }

    try {
      // Extraer el business slug del returnUrl si existe
      let businessSlug: string | undefined
      const from = searchParams.get('from')
      if (from) {
        const decodedFrom = decodeURIComponent(from)
        console.log('[Cliente Login] From URL:', decodedFrom)

        const extractSlugFromPath = (path: string): string | undefined => {
          // Primero patrones /business/:slug o /b/:slug
          const bizMatch = path.match(/\/(?:business|b)\/([^\/\?#]+)/)
          if (bizMatch && bizMatch[1]) return bizMatch[1]
          // Luego primer segmento directo, evitando /cliente
          const dirMatch = path.match(/^\/([^\/\?#]+)/)
          if (dirMatch && dirMatch[1] !== 'cliente') return dirMatch[1]
          return undefined
        }

        // Intentar extraer el slug del negocio de la URL
        if (decodedFrom.includes('://')) {
          // URL completa
          const url = new URL(decodedFrom)
          businessSlug = extractSlugFromPath(url.pathname)
        } else if (decodedFrom.startsWith('/')) {
          // Path relativo
          businessSlug = extractSlugFromPath(decodedFrom)
        } else {
          // Texto plano (posible slug)
          businessSlug = decodedFrom
        }
      }
      
      console.log('[Cliente Login] Extracted businessSlug:', businessSlug)

      const endpoint = isLogin ? '/api/cliente/auth/login' : '/api/cliente/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, businessSlug })
      })

      const data = await response.json()

      if (!response.ok) {
        // Mensajes claros por estado
        if (response.status === 401) {
          setError('Credenciales inválidas. Verifica tu email y contraseña.')
        } else if (response.status === 429) {
          // Intentar obtener el tiempo de espera restante
          const headerRetry = response.headers.get('Retry-After')
          const retryAfterSec = Number.isFinite(Number(headerRetry))
            ? Number(headerRetry)
            : (typeof data?.retryAfter === 'number' ? data.retryAfter : undefined)

          if (retryAfterSec && retryAfterSec > 0) {
            const minutes = Math.floor(retryAfterSec / 60)
            const seconds = retryAfterSec % 60
            const human = minutes > 0
              ? `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}${seconds > 0 ? ` y ${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}` : ''}`
              : `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`
            setError(`Demasiados intentos. Intenta nuevamente en ${human}.`)
          } else {
            setError(data?.error || 'Demasiados intentos. Intenta más tarde.')
          }
        } else if (data?.warning) {
          // Si hay advertencia sobre intentos restantes, mostrarla
          setError(`${data.error}. ${data.warning}`)
        } else if (data?.locked) {
          setError(data.error)
        } else {
          setError(data?.error || 'Error al procesar solicitud')
        }
        setIsLoading(false)
        return
      }

      // Cookie se establece automáticamente desde el servidor
      // No necesitamos guardar nada en localStorage
      
      // Si requiere verificación, redirigir a la página de verificación
      if (data.requiresVerification) {
        const fromParam = searchParams.get('from')
        if (fromParam) {
          router.push(`/cliente/verify?from=${encodeURIComponent(fromParam)}`)
        } else {
          router.push('/cliente/verify')
        }
      } else {
        // Siempre redirigir al dashboard, pero pasando el parámetro from si existe
        const redirectTo = searchParams.get('from')
        if (redirectTo) {
          // Pasar el negocio de origen al dashboard
          router.push(`/cliente/dashboard?from=${encodeURIComponent(redirectTo)}`)
        } else {
          router.push('/cliente/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
              <User className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Portal de Cliente' : 'Crear Cuenta'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isLogin 
                ? 'Accede para ver tus paquetes y reservas'
                : 'Regístrate para gestionar tus servicios'}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm text-center">{successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Juan"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Pérez García"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
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
                  placeholder="••••••••"
                  required
                  minLength={isLogin ? 6 : 8}
                />
              </div>
              {!isLogin && passwordErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordErrors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-500 flex items-center">
                      <span className="mr-1">✗</span> {err}
                    </p>
                  ))}
                </div>
              )}
              {!isLogin && formData.password && passwordErrors.length === 0 && (
                <p className="mt-2 text-xs text-green-500 flex items-center">
                  <span className="mr-1">✓</span> Contraseña segura
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
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-2 text-xs text-red-500">Las contraseñas no coinciden</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="mt-2 text-xs text-green-500 flex items-center">
                    <span className="mr-1">✓</span> Las contraseñas coinciden
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
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  <ArrowRight className="ml-2" size={20} />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
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

          {/* Back to previous page */}
          <div className="mt-4 text-center">
            <Link href={returnUrl} className="text-gray-500 hover:text-gray-700 text-sm">
              ← Volver
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
