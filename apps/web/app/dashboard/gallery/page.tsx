'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'
import { useAutoFocusFirstInput } from '@/hooks/useAutoFocusFirstInput'

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
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<{ url?: string; title?: string }>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const modalRef = useRef<HTMLDivElement>(null)
  useAutoFocusFirstInput(showAddModal, modalRef)
  const confirm = useConfirm()
  const toast = useToast()

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
      const categoriesRes = await fetch('/api/dashboard/gallery-categories')
      if (categoriesRes.ok) {
        const categories = await categoriesRes.json()
        if (Array.isArray(categories) && categories.length > 0) {
          setAvailableCategories(categories.sort((a: any, b: any) => a.order - b.order).map((c: any) => c.name))
        } else {
          setAvailableCategories([])
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      setAvailableCategories([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Client-side validation
    const errs: { url?: string; title?: string } = {}
    if (!formData.title.trim()) errs.title = t('fieldRequired') || 'This field is required'
    if (!formData.url.trim()) errs.url = t('fieldRequired') || 'This field is required'
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) {
      toast(t('validationError') || 'Please correct the highlighted fields', 'error')
      return
    }
    setSaving(true)
    try {
      let response: Response
      if (editingItem) {
        // Update existing item using PUT
        response = await fetch('/api/dashboard/gallery', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...formData })
        })
      } else {
        // Add new item
        response = await fetch('/api/dashboard/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
      }
      
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
      } else {
        const data = await response.json().catch(() => ({}))
        toast(data.error || (t('failedToSaveGalleryItem') || 'Failed to save gallery item'), 'error')
      }
    } catch (error) {
      console.error('Error saving gallery item:', error)
      toast(t('failedToSaveGalleryItem') || 'Failed to save gallery item', 'error')
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

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'gallery')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || (t('failedToUploadImage') || 'Failed to upload image'), 'error')
        return
      }
      setFormData((prev) => ({ ...prev, url: data.url }))
      toast(t('uploaded') || 'Uploaded', 'success')
    } catch (e) {
      console.error('Upload error:', e)
      toast(t('failedToUploadImage') || 'Failed to upload image', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('delete') || 'Delete',
      message: t('deleteGalleryItemConfirm') || 'Are you sure you want to delete this item?',
      confirmText: t('delete') || 'Delete',
      variant: 'danger'
    })
    if (ok) {
      setSaving(true)
      try {
        const response = await fetch(`/api/dashboard/gallery?id=${id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await loadGalleryItems()
          toast(t('deleted') || 'Deleted', 'success')
        }
      } catch (error) {
        console.error('Error deleting gallery item:', error)
        toast(t('failedToDeleteGalleryItem') || 'Failed to delete gallery item', 'error')
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
            <h1 className="text-3xl font-bold text-gray-900">{t('galleryManagement') || 'Gallery Management'}</h1>
            <p className="mt-2 text-sm text-gray-700">{t('galleryManagementSubtitle') || 'Upload and manage images and videos of your work'}</p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
            <Link
              href="/dashboard/gallery-categories"
              className="block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {t('manageCategories')}
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              {t('addMedia') || 'Add Media'}
            </button>
          </div>
        </div>

        {/* Category Filter */}
        {(() => {
          const derived = Array.from(new Set(galleryItems.map((g) => g.category).filter(Boolean))) as string[]
          const cats = ['all', ...(availableCategories.length ? availableCategories : derived)]
          if (cats.length <= 1) return null
          return (
            <div className="mt-6 mb-2 flex gap-2 flex-wrap">
              {cats.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {cat === 'all' ? t('all') : cat}
                </button>
              ))}
            </div>
          )
        })()}

        {/* Gallery Grid */}
        {galleryItems.length === 0 ? (
          <div className="mt-8 text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('noGalleryItems') || 'No gallery items'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('startBuildingGallery') || 'Get started by uploading your first image or video'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                {t('uploadMedia') || 'Upload Media'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(selectedCategory === 'all' ? galleryItems : galleryItems.filter(i => (i.category || '') === selectedCategory)).map((item) => (
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
              
              <div ref={modalRef} className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <form onSubmit={handleSubmit}>
                  <div>
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      {editingItem ? (t('editGalleryItem') || 'Edit Gallery Item') : (t('addGalleryItem') || 'Add Gallery Item')}
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('typeLabel') || 'Type'}</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value as 'image' | 'video'})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="image">{t('image') || 'Image'}</option>
                          <option value="video">{t('video') || 'Video'}</option>
                        </select>
                      </div>

                      {/* Upload helper for images */}
                      {formData.type === 'image' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">{t('uploadImage') || 'Upload image'}</label>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={uploading}
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) void handleFileUpload(f)
                            }}
                            className="mt-1 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {uploading && <p className="text-xs text-gray-500 mt-1">{t('uploading') || 'Uploading...'}</p>}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700">URL</label>
                        <input
                          type={formData.type === 'video' ? 'url' : 'text'}
                          required
                          value={formData.url}
                          onChange={(e) => { setFormData({...formData, url: e.target.value}); setFormErrors(fe => ({ ...fe, url: undefined })) }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder={formData.type === 'image' ? 'https://... or /gallery/<id>_800.webp' : 'https://youtu.be/...'}
                        />
                        {formErrors.url && <p className="text-xs text-red-600 mt-1">{formErrors.url}</p>}
                        {formData.type === 'image' && (
                          <p className="mt-1 text-xs text-gray-500">
                            {t('tipExternalImages') || 'Tip: External image links (e.g., from Google) may block hotlinking. Uploading here is more reliable.'}
                          </p>
                        )}
                        {formData.type === 'image' && (
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={!formData.url || importing}
                              onClick={async () => {
                                if (!formData.url) return
                                try {
                                  setImporting(true)
                                  const res = await fetch('/api/upload/import', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ url: formData.url, type: 'gallery' })
                                  })
                                  const data = await res.json()
                                  if (!res.ok) {
                                    toast(data.error || (t('failedToUploadImage') || 'Failed to import image'), 'error')
                                  } else {
                                    setFormData(prev => ({ ...prev, url: data.url }))
                                    toast(t('uploaded') || 'Imported', 'success')
                                  }
                                } catch (e) {
                                  console.error('Import error:', e)
                                  toast(t('failedToUploadImage') || 'Failed to import image', 'error')
                                } finally {
                                  setImporting(false)
                                }
                              }}
                              className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                            >
                              {importing ? (t('saving') || 'Processing...') : (t('importFromUrl') || 'Import from URL')}
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('title') || 'Title'}</label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => { setFormData({...formData, title: e.target.value}); setFormErrors(fe => ({ ...fe, title: undefined })) }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">{`${t('descriptionTitle') || 'Description'} (${t('optional') || 'Optional'})`}</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('category') || 'Category'}</label>
                        {!showNewCategory ? (
                          <div className="mt-1 flex gap-2">
                            <select
                              value={formData.category}
                              onChange={(e) => setFormData({...formData, category: e.target.value})}
                              className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">{t('selectCategory') || 'Select category'}</option>
                              {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setShowNewCategory(true)}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                            >
                              {t('newLabel') || 'New'}
                            </button>
                            <a
                              href="/dashboard/gallery-categories"
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                            >
                              {t('manageCategories') || 'Manage Categories'}
                            </a>
                          </div>
                        ) : (
                          <div className="mt-1 flex gap-2">
                            <input
                              type="text"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              placeholder={t('newCategoryNamePlaceholder') || 'New category name'}
                              className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  if (newCategory) {
                                    const order = (availableCategories?.length || 0) + 1
                                    const res = await fetch('/api/dashboard/gallery-categories', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ name: newCategory, order })
                                    })
                                    if (res.ok) {
                                      setFormData({ ...formData, category: newCategory })
                                      await loadCategories()
                                    } else {
                                      const data = await res.json().catch(() => ({}))
                                      toast(data.error || (t('failedToSaveCategory') || 'Failed to save category'), 'error')
                                    }
                                    setNewCategory('')
                                  }
                                } catch (err) {
                                  console.error('Error creating category:', err)
                                  toast(t('failedToSaveCategory') || 'Failed to save category', 'error')
                                } finally {
                                  setShowNewCategory(false)
                                }
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                            >
                              {t('add') || 'Add'}
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
                        ? (t('saving') || 'Saving...')
                        : (editingItem ? (t('saveChanges') || 'Save Changes') : (t('addItem') || 'Add Item'))}
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

