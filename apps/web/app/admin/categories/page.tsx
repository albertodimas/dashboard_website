'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import Link from 'next/link'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  isActive: boolean
  order: number
  _count?: {
    businesses: number
  }
}

export default function CategoriesPage() {
  const { t } = useLanguage()
  const confirm = useConfirm()
  const toast = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Category>>({})
  const [showNewForm, setShowNewForm] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📋',
    color: '#B2BEC3',
    isActive: true
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError(t('failedToFetchCategories') || 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim()
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setEditForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '',
      isActive: category.isActive
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          ...editForm
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update category')
      }

      await fetchCategories()
      setEditingId(null)
      setEditForm({})
      setError('')
    } catch (error) {
      console.error('Error updating category:', error)
      setError(error instanceof Error ? error.message : (t('failedToUpdateCategory') || 'Failed to update category'))
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: t('delete') || 'Delete',
      message: `${t('deleteCategoryConfirmPrefix') || 'Are you sure you want to delete the category'} "${name}"?`,
      confirmText: t('delete') || 'Delete',
      variant: 'danger'
    })
    if (!ok) return

    try {
      const response = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete category')
      }

      await fetchCategories()
      setError('')
      toast(t('deleted') || 'Deleted', 'success')
    } catch (error) {
      console.error('Error deleting category:', error)
      setError(error instanceof Error ? error.message : (t('failedToDeleteCategory') || 'Failed to delete category'))
      toast(t('failedToDeleteCategory') || 'Failed to delete category', 'error')
    }
  }

  const handleCreateCategory = async () => {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create category')
      }

      await fetchCategories()
      setShowNewForm(false)
      setNewCategory({
        name: '',
        slug: '',
        description: '',
        icon: '📋',
        color: '#B2BEC3',
        isActive: true
      })
      setError('')
    } catch (error) {
      console.error('Error creating category:', error)
      setError(error instanceof Error ? error.message : (t('failedToCreateCategory') || 'Failed to create category'))
    }
  }

  const handleReorder = async (categoryId: string, newOrder: number) => {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: categoryId,
          order: newOrder
        })
      })

      if (!response.ok) throw new Error('Failed to update order')
      await fetchCategories()
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{t('manageCategories') || 'Manage Categories'}</h1>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('addNewCategory') || 'Add New Category'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {showNewForm && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{t('addNewCategory') || 'Add New Category'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('name') || 'Name'}</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setNewCategory({
                      ...newCategory,
                      name,
                      slug: generateSlug(name)
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('categoryNamePlaceholder') || 'e.g. Hair Salon'}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('slug') || 'Slug'}</label>
                <input
                  type="text"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('categorySlugPlaceholder') || 'peluqueria'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('iconEmoji') || 'Icon (Emoji)'}</label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="💇"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('colorHex') || 'Color (Hex)'}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#FF6B6B"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{`${t('descriptionTitle') || 'Description'} (${t('optional') || 'Optional'})`}</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('categoryDescriptionPlaceholder') || 'Category description'}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCreateCategory}
                disabled={!newCategory.name || !newCategory.slug}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {t('saveChanges') || 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowNewForm(false)
                  setNewCategory({
                    name: '',
                    slug: '',
                    description: '',
                    icon: '📋',
                    color: '#B2BEC3',
                    isActive: true
                  })
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {t('cancelBtn') || 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orderTitle') || 'Order'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('icon') || 'Icon'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name') || 'Name'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('slug') || 'Slug'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('color') || 'Color'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('businessesTitle') || 'Businesses'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status') || 'Status'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={category.order}
                      onChange={(e) => handleReorder(category.id, parseInt(e.target.value))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      min="0"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-2xl">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={editForm.icon || ''}
                        onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                        className="w-12 px-2 py-1 border border-gray-300 rounded text-base"
                      />
                    ) : (
                      category.icon
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium">{category.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={editForm.slug || ''}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <span className="text-gray-600">{category.slug}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === category.id ? (
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={editForm.color || ''}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editForm.color || ''}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: category.color || '#B2BEC3' }}
                        />
                        <span className="text-xs text-gray-600">{category.color}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-600">{category._count?.businesses || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === category.id ? (
                      <select
                        value={editForm.isActive ? 'true' : 'false'}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="true">{t('active') || 'Active'}</option>
                        <option value="false">{t('inactive') || 'Inactive'}</option>
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.isActive ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === category.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setEditForm({})
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id, category.name)}
                          className="text-red-600 hover:text-red-900"
                          disabled={!!(category._count?.businesses && category._count.businesses > 0)}
                        >
                          <Trash2 className={`w-5 h-5 ${
                            (category._count?.businesses && category._count.businesses > 0)
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
