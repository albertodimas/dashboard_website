'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Calendar, Clock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

interface PackagePurchase {
  id: string
  packageId: string
  customerId: string
  businessId: string
  purchaseDate: string
  expiresAt: string | null
  remainingSessions: number
  status: string
  package: {
    name: string
    description: string
    sessionCount: number
    validityDays: number
    price: number
  }
  business: {
    name: string
    customSlug: string
    slug: string
  }
}

export default function ClientPackagesPage() {
  const router = useRouter()
  const [packages, setPackages] = useState<PackagePurchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active')

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (!token) {
      router.push('/cliente/login')
      return
    }
    fetchPackages(token)
  }, [])

  const fetchPackages = async (token: string) => {
    try {
      const response = await fetch('/api/cliente/packages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch packages')
      }

      const data = await response.json()
      setPackages(data.packages || [])
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const activePackages = packages.filter(pkg => 
    pkg.status === 'ACTIVE' && 
    (!pkg.expiresAt || new Date(pkg.expiresAt) > new Date()) &&
    pkg.remainingSessions > 0
  )
  
  const expiredPackages = packages.filter(pkg => 
    pkg.status !== 'ACTIVE' || 
    (pkg.expiresAt && new Date(pkg.expiresAt) <= new Date()) ||
    pkg.remainingSessions === 0
  )

  const displayedPackages = activeTab === 'active' ? activePackages : expiredPackages

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cliente/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            Volver al panel
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Mis Paquetes</h1>
          <p className="text-gray-600 mt-2">Gestiona tus paquetes de sesiones</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'active'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Activos ({activePackages.length})
            </button>
            <button
              onClick={() => setActiveTab('expired')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'expired'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Expirados ({expiredPackages.length})
            </button>
          </div>
        </div>

        {/* Packages List */}
        {displayedPackages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'active' ? 'No tienes paquetes activos' : 'No tienes paquetes expirados'}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'active' && 'Los paquetes te permiten reservar múltiples sesiones con descuento'}
            </p>
            {activeTab === 'active' && (
              <Link
                href="/cliente/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Explorar paquetes disponibles
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {displayedPackages.map((pkg) => {
              const isExpired = pkg.expiresAt && new Date(pkg.expiresAt) <= new Date()
              const noSessionsLeft = pkg.remainingSessions === 0
              const isInactive = pkg.status !== 'ACTIVE'
              const canUse = !isExpired && !noSessionsLeft && !isInactive

              return (
                <div key={pkg.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {pkg.package.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {pkg.business.name}
                        </p>
                      </div>
                      {canUse ? (
                        <CheckCircle className="text-green-500" size={24} />
                      ) : (
                        <AlertCircle className="text-gray-400" size={24} />
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      {pkg.package.description}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Sesiones restantes</span>
                        <span className="font-semibold">
                          {pkg.remainingSessions} / {pkg.package.sessionCount}
                        </span>
                      </div>

                      {pkg.expiresAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Vence</span>
                          <span className={`font-semibold ${isExpired ? 'text-red-600' : ''}`}>
                            {new Date(pkg.expiresAt).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Fecha de compra</span>
                        <span className="text-sm">
                          {new Date(pkg.purchaseDate).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(pkg.remainingSessions / pkg.package.sessionCount) * 100}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((pkg.remainingSessions / pkg.package.sessionCount) * 100)}% disponible
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        canUse
                          ? 'bg-green-100 text-green-700'
                          : noSessionsLeft
                          ? 'bg-orange-100 text-orange-700'
                          : isExpired
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {canUse && 'Activo'}
                        {noSessionsLeft && 'Sin sesiones'}
                        {isExpired && !noSessionsLeft && 'Expirado'}
                        {isInactive && !isExpired && !noSessionsLeft && 'Inactivo'}
                      </span>

                      {canUse && (
                        <Link
                          href={`/b/${pkg.business.customSlug || pkg.business.slug}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Usar paquete →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            ¿Cómo funcionan los paquetes?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <CheckCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              Compra un paquete y ahorra en múltiples sesiones
            </li>
            <li className="flex items-start">
              <CheckCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              Usa tus sesiones antes de la fecha de vencimiento
            </li>
            <li className="flex items-start">
              <CheckCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              Reserva fácilmente usando tus sesiones disponibles
            </li>
            <li className="flex items-start">
              <CheckCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              Consulta tu saldo y vencimiento en cualquier momento
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}