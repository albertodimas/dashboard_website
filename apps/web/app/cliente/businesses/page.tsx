'use client'

import { logger } from '@/lib/logger'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, MapPin, Star, Clock, ArrowLeft, Filter } from 'lucide-react'

interface Business {
  id: string
  name: string
  description?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  phone?: string | null
  email?: string | null
  slug: string
  rating?: number | null
  reviews?: number | null
  servicesCount?: number | null
  isPremium?: boolean | null
  logo?: string | null
  coverImage?: string | null
}

export default function ClientBusinessesPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [cities, setCities] = useState<string[]>([])

  const fetchBusinesses = useCallback(async () => {
    try {
      const response = await fetch('/api/public/businesses')

      if (!response.ok) {
        throw new Error('Failed to fetch businesses')
      }

      const businessList = (await response.json()) as Business[]
      setBusinesses(businessList)
      setFilteredBusinesses(businessList)

      const uniqueCities = [
        ...new Set(
          businessList
            .map((b) => b.city)
            .filter((city): city is string => Boolean(city))
        ),
      ]
      setCities(uniqueCities)
    } catch (error) {
      logger.error('Error fetching businesses:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (!token) {
      router.push('/cliente/login')
      return
    }

    void fetchBusinesses()
  }, [fetchBusinesses, router])

  useEffect(() => {
    let filtered = businesses

    if (searchTerm) {
      filtered = filtered.filter(
        (business) =>
          business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCity) {
      filtered = filtered.filter((business) => business.city === selectedCity)
    }

    setFilteredBusinesses(filtered)
  }, [searchTerm, selectedCity, businesses])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cliente/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            Volver al panel
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Explorar Negocios</h1>
          <p className="text-gray-600 mt-2">Encuentra y reserva en los mejores negocios</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar negocios o servicios..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="">Todas las ciudades</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {searchTerm || selectedCity ? (
          <div className="mb-4">
            <p className="text-gray-600">
              Se encontraron {filteredBusinesses.length} negocios
            </p>
          </div>
        ) : null}

        {/* Businesses Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Search className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron negocios
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedCity
                ? 'Intenta con otros términos de búsqueda o filtros'
                : 'No hay negocios disponibles en este momento'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <Link
                key={business.id}
                href={`/${business.slug}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {business.isPremium && (
                    <div className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full mb-2">
                      Premium
                    </div>
                  )}

                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {business.name}
                  </h3>

                  {business.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {business.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin size={16} className="mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {business.address ?? 'Dirección no disponible'}
                      </span>
                    </div>

                    {(business.rating ?? 0) > 0 && (
                      <div className="flex items-center text-sm">
                        <Star size={16} className="mr-1 text-yellow-500 fill-current" />
                        <span className="font-medium text-gray-900">
                          {(business.rating ?? 0).toFixed(1)}
                        </span>
                        <span className="text-gray-500 ml-1">
                          ({business.reviews ?? 0} reseñas)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Services Count */}
                  {(business.servicesCount ?? 0) > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600">
                        {business.servicesCount}{' '}
                        {business.servicesCount === 1
                          ? 'servicio disponible'
                          : 'servicios disponibles'}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <span className="inline-flex items-center text-blue-600 text-sm font-medium">
                      Ver detalles y reservar →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
