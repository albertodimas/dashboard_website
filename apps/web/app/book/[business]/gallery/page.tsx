'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'

interface GalleryItem {
  id: string
  type: 'image' | 'video'
  url: string
  title: string
  description?: string
  category?: string
  createdAt: string
}

export default function GalleryPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const businessId = params.business as string
  
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Load public business info including gallery items (no auth required)
    const loadBusinessAndGallery = async () => {
      try {
        const response = await fetch(`/api/public/business/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBusinessInfo({
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address
          })
          // Use gallery_items from the public endpoint
          const items = Array.isArray(data.galleryItems) ? data.galleryItems : []
          setGalleryItems(items)
        } else {
          setGalleryItems([])
        }
      } catch (error) {
        logger.error('Error loading business info or gallery:', error)
        setGalleryItems([])
      } finally {
        setLoading(false)
      }
    }

    loadBusinessAndGallery()
  }, [businessId])
  
  const getBusinessName = () => {
    return businessInfo.name || businessId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  const getCategories = () => {
    const categories = [...new Set(galleryItems.map(item => item.category || 'Other'))]
    return ['all', ...categories]
  }
  
  const filteredItems = selectedCategory === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory)
  
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
      {/* Header with navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/directory" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                {t('backToDirectory') || 'Back to Directory'}
              </Link>
              <span className="text-gray-400">|</span>
              <Link 
                href={`/book/${businessId}`}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('bookAppointmentCTA') || 'Book Appointment'}
              </Link>
              <span className="text-gray-400">|</span>
              <h1 className="text-2xl font-bold text-gray-900">{getBusinessName()} - {t('gallery') || 'Gallery'}</h1>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        {galleryItems.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {getCategories().map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category === 'all' ? (t('all') || 'All') : category}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noImagesOrVideosYet') || 'No images or videos yet'}</h3>
            <p className="text-gray-600">{t('noWorkSamplesYet') || "The business hasn't uploaded any work samples yet."}</p>
            <Link
              href={`/book/${businessId}`}
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('bookAppointmentCTA') || 'Book Appointment'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="relative group cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold">{item.title}</h3>
                    {item.description && (
                      <p className="text-white/80 text-sm mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal for viewing item */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            
            <div className="p-4">
              {selectedItem.type === 'image' ? (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : (
                <video
                  src={selectedItem.url}
                  controls
                  autoPlay
                  className="w-full h-auto max-h-[70vh]"
                />
              )}
              
              <div className="mt-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedItem.title}</h2>
                {selectedItem.description && (
                  <p className="mt-2 text-gray-600">{selectedItem.description}</p>
                )}
                {selectedItem.category && (
                  <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {selectedItem.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
