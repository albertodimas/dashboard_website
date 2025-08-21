'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'

interface Business {
  id: string
  slug: string
  name: string
  description: string
  category: string
  address: string
  city: string
  state: string
  phone: string
  email: string
  website?: string
  rating: number
  reviews: number
  servicesCount: number
  isPremium: boolean
  logo?: string
  coverImage?: string
}

export default function DirectoryPage() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Load businesses from API
    const loadBusinesses = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/public/businesses')
        if (response.ok) {
          const data = await response.json()
          setBusinesses(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Error loading businesses:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadBusinesses()
  }, [])

  const categories = ['all', 'Services', 'Barbershop', 'Salon', 'Spa']

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || business.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold">{t('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('language') === 'en' ? 'Business Directory' : 'Directorio de Negocios'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {t('language') === 'en' 
                  ? 'Find and book appointments with local businesses'
                  : 'Encuentra y agenda citas con negocios locales'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t('language') === 'en' ? 'Business Login' : 'Acceso Negocios'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto mb-6">
          <input
            type="text"
            placeholder={t('language') === 'en' 
              ? 'Search for businesses, services...' 
              : 'Buscar negocios, servicios...'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category === 'all' 
                ? (t('language') === 'en' ? 'All' : 'Todos')
                : category}
            </button>
          ))}
        </div>
      </div>

      {/* Business Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map(business => (
            <div
              key={business.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{business.image}</div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {business.category}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {business.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  {business.description}
                </p>

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {business.address}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    {business.phone}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400">
                      {'⭐'.repeat(Math.floor(business.rating))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {business.rating} ({business.reviews} {t('language') === 'en' ? 'reviews' : 'reseñas'})
                    </span>
                  </div>
                  <span className="text-gray-700 font-semibold">{business.priceRange}</span>
                </div>
                
                <div className="flex gap-2">
                  <Link
                    href={`/book/${business.slug}/gallery`}
                    className="flex-1 text-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {t('language') === 'en' ? 'Gallery' : 'Galería'}
                  </Link>
                  <Link
                    href={`/book/${business.slug}`}
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {t('language') === 'en' ? 'Book Appointment' : 'Reservar Cita'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {t('language') === 'en' 
                ? 'No businesses found matching your search.'
                : 'No se encontraron negocios que coincidan con tu búsqueda.'}
            </p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('language') === 'en' 
              ? 'Are you a business owner?' 
              : '¿Eres dueño de un negocio?'}
          </h2>
          <p className="text-blue-100 mb-6">
            {t('language') === 'en'
              ? 'Join our platform and start managing your appointments online'
              : 'Únete a nuestra plataforma y comienza a gestionar tus citas en línea'}
          </p>
          <Link
            href="/register"
            className="inline-block px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100"
          >
            {t('language') === 'en' ? 'Get Started Free' : 'Comienza Gratis'}
          </Link>
        </div>
      </div>
    </div>
  )
}