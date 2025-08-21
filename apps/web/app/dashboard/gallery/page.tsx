'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'

interface GalleryItem {
  id: string
  type: 'image' | 'video'
  url: string
  title: string
  description?: string
  category?: string
  createdAt: string
}

export default function GalleryManagementPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [formData, setFormData] = useState({
    type: 'image' as 'image' | 'video',
    url: '',
    title: '',
    description: '',
    category: ''
  })
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(() => {
        // Load gallery items and categories
        loadGalleryItems()
        loadCategories()
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const loadGalleryItems = async () => {
    try {
      const response = await fetch('/api/dashboard/gallery')
      if (response.ok) {
        const data = await response.json()
        setGalleryItems(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
      setGalleryItems([])
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      // Get categories from services
      const servicesRes = await fetch('/api/dashboard/services')
      if (servicesRes.ok) {
        const services = await servicesRes.json()
        const serviceCategories = [...new Set(services.map((s: any) => s.category).filter(Boolean))]
        
        // Get categories from existing gallery items
        const galleryCategories = [...new Set(galleryItems.map(item => item.category).filter(Boolean))]
        
        // Combine and deduplicate
        const allCategories = [...new Set([...serviceCategories, ...galleryCategories])]
        setAvailableCategories(allCategories.sort())
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      if (editingItem) {
        // For now, we'll delete and re-add since we don't have a PUT endpoint
        await fetch(`/api/dashboard/gallery?id=${editingItem.id}`, {
          method: 'DELETE'
        })
      }
      
      // Add new item (or replacement for edited item)
      const response = await fetch('/api/dashboard/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await loadGalleryItems()
        await loadCategories()
        
        // Reset form
        setFormData({
          type: 'image',
          url: '',
          title: '',
          description: '',
          category: ''
        })
        setShowAddModal(false)
        setEditingItem(null)
      }
    } catch (error) {
      console.error('Error saving gallery item:', error)
      alert(t('language') === 'en' ? 'Failed to save gallery item' : 'Error al guardar el elemento de galería')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      url: item.url,
      title: item.title,
      description: item.description || '',
      category: item.category || ''
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm(t('language') === 'en' ? 'Are you sure you want to delete this item?' : '¿Estás seguro de que quieres eliminar este elemento?')) {
      setSaving(true)
      try {
        const response = await fetch(`/api/dashboard/gallery?id=${id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await loadGalleryItems()
        }
      } catch (error) {
        console.error('Error deleting gallery item:', error)
        alert(t('language') === 'en' ? 'Failed to delete gallery item' : 'Error al eliminar el elemento de galería')
      } finally {
        setSaving(false)
      }
    }
  }

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
      <DashboardNav />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('language') === 'en' ? 'Gallery Management' : 'Gestión de Galería'}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              {t('language') === 'en' 
                ? 'Upload and manage images and videos of your work'
                : 'Sube y gestiona imágenes y videos de tu trabajo'}
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              onClick={() => setShowAddModal(true)}
              className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              {t('language') === 'en' ? 'Add Media' : 'Agregar Media'}
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {galleryItems.length === 0 ? (
          <div className="mt-8 text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('language') === 'en' ? 'No gallery items' : 'No hay elementos en la galería'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('language') === 'en' 
                ? 'Get started by uploading your first image or video'
                : 'Comienza subiendo tu primera imagen o video'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                {t('language') === 'en' ? 'Upload Media' : 'Subir Media'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item) => (
              <div key={item.id} className="relative group bg-white rounded-lg shadow overflow-hidden">
                <div className="aspect-w-16 aspect-h-9">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="w-full h-48 object-cover"
                      controls={false}
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  )}
                  {item.category && (
                    <span className="mt-2 inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                      {item.category}
                    </span>
                  )}
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => handleEdit(item)}
                      disabled={saving}
                      className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={saving}
                      className="text-sm text-red-600 hover:text-red-500 disabled:opacity-50"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)} />
              
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <form onSubmit={handleSubmit}>
                  <div>
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      {editingItem 
                        ? (t('language') === 'en' ? 'Edit Gallery Item' : 'Editar Elemento de Galería')
                        : (t('language') === 'en' ? 'Add Gallery Item' : 'Agregar Elemento de Galería')}
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('language') === 'en' ? 'Type' : 'Tipo'}
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value as 'image' | 'video'})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="image">{t('language') === 'en' ? 'Image' : 'Imagen'}</option>
                          <option value="video">{t('language') === 'en' ? 'Video' : 'Video'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          URL
                        </label>
                        <input
                          type="url"
                          required
                          value={formData.url}
                          onChange={(e) => setFormData({...formData, url: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('language') === 'en' ? 'Title' : 'Título'}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('language') === 'en' ? 'Description (optional)' : 'Descripción (opcional)'}
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('language') === 'en' ? 'Category' : 'Categoría'}
                        </label>
                        {!showNewCategory ? (
                          <div className="mt-1 flex gap-2">
                            <select
                              value={formData.category}
                              onChange={(e) => setFormData({...formData, category: e.target.value})}
                              className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">{t('language') === 'en' ? 'Select category' : 'Seleccionar categoría'}</option>
                              {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setShowNewCategory(true)}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                            >
                              {t('language') === 'en' ? 'New' : 'Nueva'}
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1 flex gap-2">
                            <input
                              type="text"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              placeholder={t('language') === 'en' ? 'New category name' : 'Nombre de nueva categoría'}
                              className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newCategory) {
                                  setFormData({...formData, category: newCategory})
                                  setAvailableCategories([...availableCategories, newCategory].sort())
                                  setNewCategory('')
                                }
                                setShowNewCategory(false)
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                            >
                              {t('language') === 'en' ? 'Add' : 'Agregar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewCategory(false)
                                setNewCategory('')
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                            >
                              {t('cancelBtn')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 sm:col-start-2"
                    >
                      {saving 
                        ? (t('language') === 'en' ? 'Saving...' : 'Guardando...')
                        : (editingItem ? t('saveChanges') : (t('language') === 'en' ? 'Add Item' : 'Agregar Elemento'))}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false)
                        setEditingItem(null)
                        setFormData({
                          type: 'image',
                          url: '',
                          title: '',
                          description: '',
                          category: ''
                        })
                      }}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    >
                      {t('cancelBtn')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}