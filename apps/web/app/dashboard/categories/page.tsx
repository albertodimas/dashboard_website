'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'

interface Category {
  id: string
  name: string
  order: number
}

export default function CategoriesPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', order: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(() => {
        // Load categories from API
        loadCategories()
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/dashboard/categories')
      if (response.ok) {
        const data = await response.json()
        // NO default categories - start with empty array if none exist
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = () => {
    setFormData({ name: '', order: categories.length + 1 })
    setShowAddModal(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setFormData({ name: category.name, order: category.order })
    setShowEditModal(true)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryToDelete = categories.find(c => c.id === categoryId)
    if (!categoryToDelete) return

    // Check if category is being used by any service
    try {
      const servicesRes = await fetch('/api/dashboard/services')
      if (servicesRes.ok) {
        const services = await servicesRes.json()
        const isUsed = services.some((s: any) => s.category === categoryToDelete.name)
        
        if (isUsed) {
          alert(t('cannotDeleteCategoryInUse') || 'Cannot delete this category because it has services assigned to it.')
          return
        }
      }
    } catch (error) {
      console.error('Error checking services:', error)
    }

    if (confirm((t('deleteCategoryConfirmPrefix') || 'Are you sure you want to delete the category') + ` "${categoryToDelete.name}"?`)) {
      
      setSaving(true)
      try {
        const response = await fetch(`/api/dashboard/categories?id=${categoryId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await loadCategories()
        }
      } catch (error) {
        console.error('Error deleting category:', error)
        alert(t('failedToDeleteCategory') || 'Failed to delete category')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      if (showEditModal && editingCategory) {
        // Update existing category
        const response = await fetch('/api/dashboard/categories', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingCategory.id,
            name: formData.name,
            order: formData.order
          })
        })
        
        if (response.ok) {
          setShowEditModal(false)
          setEditingCategory(null)
          await loadCategories()
        }
      } else {
        // Add new category
        const response = await fetch('/api/dashboard/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            order: formData.order
          })
        })
        
        if (response.ok) {
          setShowAddModal(false)
          await loadCategories()
        }
      }
      
      setFormData({ name: '', order: 0 })
    } catch (error) {
      console.error('Error saving category:', error)
      alert(t('failedToSaveCategory') || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === categoryId)
    if (index === -1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= categories.length) return
    
    const updatedCategories = [...categories]
    const temp = updatedCategories[index]
    updatedCategories[index] = updatedCategories[newIndex]
    updatedCategories[newIndex] = temp
    
    // Update order values
    updatedCategories.forEach((cat, idx) => {
      cat.order = idx + 1
    })
    
    setCategories(updatedCategories)
    
    // Save all categories with new order
    setSaving(true)
    try {
      for (const cat of updatedCategories) {
        await fetch('/api/dashboard/categories', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cat)
        })
      }
    } catch (error) {
      console.error('Error updating category order:', error)
      await loadCategories() // Reload on error
    } finally {
      setSaving(false)
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
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('categories')}</h1>
            <p className="mt-2 text-sm text-gray-600">{t('manageServiceCategories') || 'Manage service categories for your business'}</p>
          </div>
          <button
            onClick={handleAddCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {t('addCategoryBtn') || '+ Add Category'}
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('noCategoriesYet') || 'No categories yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('createFirstCategoryHelp') || 'Create your first category to organize your services'}
            </p>
            <button
              onClick={handleAddCategory}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              {t('createFirstCategory') || 'Create First Category'}
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <ul className="divide-y divide-gray-200">
              {categories
                .sort((a, b) => a.order - b.order)
                .map((category, index) => (
                  <li key={category.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveCategory(category.id, 'up')}
                            disabled={index === 0 || saving}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveCategory(category.id, 'down')}
                            disabled={index === categories.length - 1 || saving}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ▼
                          </button>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                          <p className="text-sm text-gray-500">
                            {(t('orderTitle') || 'Order')}: {category.order}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          disabled={saving}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={saving}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Add Category Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {t('addNewCategory')}
              </h2>
              <form onSubmit={handleSaveCategory}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('orderTitle') || 'Order'}
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setFormData({ name: '', order: 0 })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? t('saving') : t('saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {showEditModal && editingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {t('editCategory')}
              </h2>
              <form onSubmit={handleSaveCategory}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('orderTitle') || 'Order'}
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingCategory(null)
                      setFormData({ name: '', order: 0 })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? t('saving') : t('saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
