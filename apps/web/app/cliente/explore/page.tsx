'use client'

import { logger } from '@/lib/logger'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, Filter, Star, MapPin, Clock, ChevronRight, 
  ArrowLeft, Compass, ShieldCheck, Package, Sparkles,
  Building2, Users, TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface Business {
  id: string
  name: string
  description?: string | null
  logo?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  slug: string
  customSlug?: string | null
  businessCategory?: string | null
  serviceCount?: number | null
  rating?: number | null
  reviewCount?: number | null
  isPremium?: boolean | null
  category?: {
    id: string
    name?: string | null
    slug?: string | null
    icon?: string | null
    color?: string | null
  } | null
}

interface Category {
  id: string
  name: string
  slug: string
  businessCount: number
}

export default function ExploreBusinesses() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'rating' | 'services' | 'name'>('rating')

  const fetchBusinesses = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/cliente/businesses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBusinesses(data.suggestedBusinesses || [])

        const uniqueCategories = new Map<string, Category>()
        data.suggestedBusinesses?.forEach((business: Business) => {
          if (business.category?.id) {
            if (!uniqueCategories.has(business.category.id)) {
              uniqueCategories.set(business.category.id, {
                id: business.category.id,
                name: business.category.name ?? business.category.id,
                slug: business.category.slug ?? business.category.id,
                businessCount: 1,
              })
            } else {
              const cat = uniqueCategories.get(business.category.id)!
              cat.businessCount += 1
            }
          }
        })
        setCategories(Array.from(uniqueCategories.values()))
      }
    } catch (error) {
      logger.error('Error fetching businesses:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const filterAndSortBusinesses = useCallback(() => {
    let filtered = [...businesses]

    if (selectedCategory) {
      filtered = filtered.filter((b) => b.category?.id === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      )
    }

    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'services':
        filtered.sort((a, b) => (b.serviceCount ?? 0) - (a.serviceCount ?? 0))
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    filtered.sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1
      if (!a.isPremium && b.isPremium) return 1
      return 0
    })

    setFilteredBusinesses(filtered)
  }, [businesses, searchTerm, selectedCategory, sortBy])

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (!token) {
      router.push('/cliente/login')
      return
    }

    void fetchBusinesses(token)
  }, [fetchBusinesses, router])

  useEffect(() => {
    filterAndSortBusinesses()
  }, [filterAndSortBusinesses])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/cliente/dashboard"
              className="flex items-center text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Volver al Dashboard
            </Link>
          </div>
          
          <div className="text-center py-8">
            <Compass className="mx-auto mb-4" size={48} />
            <h1 className="text-3xl font-bold mb-2">Explora Servicios Complementarios</h1>
            <p className="text-white/90 max-w-2xl mx-auto flex items-center justify-center">
              <ShieldCheck className="mr-2" size={18} />
              Descubre negocios de diferentes categorías que complementan tus servicios actuales
            </p>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, descripción o ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.businessCount})
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="rating">Mejor valorados</option>
                <option value="services">Más servicios</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{businesses.length}</p>
              <p className="text-sm text-gray-600">Negocios disponibles</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              <p className="text-sm text-gray-600">Categorías diferentes</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredBusinesses.length}</p>
              <p className="text-sm text-gray-600">Resultados encontrados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron negocios
            </h3>
            <p className="text-gray-600">
              Intenta ajustar tus filtros o términos de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <Link
                key={business.id}
                href={`/${business.customSlug || business.slug}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden group"
              >
                {/* Premium Badge */}
                {business.isPremium && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 text-xs font-medium flex items-center justify-center">
                    <Sparkles className="mr-1" size={14} />
                    Negocio Premium
                  </div>
                )}
                
                <div className="p-6">
                  {/* Logo and Category */}
                  <div className="flex items-start space-x-3 mb-3">
                    {business.logo && (
                      <img 
                        src={business.logo} 
                        alt={business.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-200 group-hover:border-purple-300 transition-colors"
                      />
                    )}
                    <div className="flex-1">
                      {business.category && (
                        <span className="inline-block px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                          {business.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Business Name */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {business.name}
                  </h3>
                  
                  {/* Description */}
                  {business.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {business.description}
                    </p>
                  )}
                  
                  {/* Location */}
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin size={14} className="mr-1" />
                    {[business.city, business.state].filter(Boolean).join(', ') || 'Ubicación no disponible'}
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <Package size={14} className="mr-1" />
                      {business.serviceCount ?? 0} servicios
                    </div>
                    
                    {(business.rating ?? 0) > 0 && (
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                        <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                        <span className="text-sm font-medium text-gray-700">
                          {(business.rating ?? 0).toFixed(1)}
                        </span>
                        {(business.reviewCount ?? 0) > 0 && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({business.reviewCount ?? 0})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* CTA */}
                  <div className="mt-4 flex items-center justify-center text-purple-600 font-medium text-sm group-hover:text-purple-700">
                    Ver servicios
                    <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}