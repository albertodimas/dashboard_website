'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  Settings, 
  MoreVertical, 
  Users, 
  Package, 
  Ban, 
  Unlock,
  Trash2,
  Edit,
  Eye
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  isActive: boolean
}

interface Business {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  city: string
  state: string
  isActive: boolean
  isPremium: boolean
  isBlocked?: boolean
  blockedReason?: string
  enableStaffModule: boolean
  businessCategory?: string
  categoryId?: string
  tenantName: string
  tenantEmail: string
  subdomain: string
  appointmentsCount: number
  servicesCount: number
  staffCount: number
  createdAt: string
  updatedAt: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [saving, setSaving] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [blockReason, setBlockReason] = useState('payment')
  const [categories, setCategories] = useState<Category[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    // Verify admin session via cookie
    fetch('/api/admin/auth/verify')
      .then(res => {
        if (!res.ok) throw new Error('Invalid session')
        return res.json()
      })
      .then(() => {
        loadBusinesses()
        loadCategories()
      })
      .catch(() => {
        router.push('/admin/login')
      })
  }, [router])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.filter((cat: Category) => cat.isActive))
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadBusinesses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/businesses')
      if (!response.ok) {
        throw new Error('Failed to load businesses')
      }
      const data = await response.json()
      setBusinesses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBlockBusiness = async () => {
    if (!selectedBusiness) return

    try {
      setSaving(true)
      const response = await fetch('/api/admin/businesses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedBusiness.id,
          isActive: false,
          isBlocked: true,
          blockedReason: blockReason === 'payment' 
            ? 'Non-payment' 
            : blockReason === 'violation' 
            ? 'Terms violation' 
            : 'Other'
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to block business')
      }
      setShowBlockModal(false)
      setSelectedBusiness(null)
      await loadBusinesses()
    } catch (error) {
      console.error('Error blocking business:', error)
      alert(t('failedToBlockBusiness') || 'Failed to block business')
    } finally {
      setSaving(false)
    }
  }

  const handleUnblockBusiness = async (business: Business) => {
    if (confirm(language.trim() === 'en' 
      ? `Unblock "${business.name}" and restore access?` 
      : `¿Desbloquear "${business.name}" y restaurar acceso?`)) {
      try {
        setSaving(true)
        const response = await fetch('/api/admin/businesses', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: business.id,
            isActive: true,
            isBlocked: false,
            blockedReason: null
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to unblock business')
        }
        await loadBusinesses()
      } catch (error) {
        console.error('Error unblocking business:', error)
        alert(t('failedToUnblockBusiness') || 'Failed to unblock business')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleDeleteBusiness = async (business: Business) => {
    const confirmMsg = language.trim() === 'en' 
      ? `Permanently delete "${business.name}"? This action cannot be undone.`
      : `¿Eliminar permanentemente "${business.name}"? Esta acción no se puede deshacer.`
    
    if (confirm(confirmMsg)) {
      try {
        setSaving(true)
        const response = await fetch(`/api/admin/businesses?id=${business.id}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          throw new Error('Failed to delete business')
        }
        await loadBusinesses()
      } catch (error) {
        console.error('Error deleting business:', error)
        alert(t('failedToDeleteBusiness') || 'Failed to delete business')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleCategoryChange = async (businessId: string, categoryId: string) => {
    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: businessId,
          categoryId: categoryId || null || null
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update category')
      }
      await loadBusinesses()
    } catch (error) {
      console.error('Error updating category:', error)
      alert(language.trim() === 'en' 
        ? 'Failed to update category' 
        : 'Error al actualizar la categoría')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth/verify', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = 
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.city.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && business.isActive && !business.isBlocked) ||
      (filterStatus === 'blocked' && business.isBlocked) ||
      (filterStatus === 'premium' && business.isPremium)
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-2xl font-semibold text-white">{t('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">{t('directoryAdministrator') || (language.trim() === 'en' ? 'Directory Administrator' : 'Administrador del Directorio')}</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/categories"
                className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-1 border border-gray-600 rounded hover:border-gray-400"
              >
                <Settings className="w-4 h-4" />
                {t('categories')}
              </Link>
              <span className="text-sm text-gray-300">
                admin@directory.com
              </span>
              <button 
                onClick={handleLogout}
                className="text-gray-300 hover:text-white px-3 py-1 border border-gray-600 rounded hover:border-gray-400"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('businessDirectoryManagement') || (language.trim() === 'en' ? 'Business Directory Management' : 'Gestión del Directorio de Negocios')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {language.trim() === 'en' 
              ? 'Manage business accounts, payments, and directory visibility'
              : 'Gestiona cuentas de negocios, pagos y visibilidad en el directorio'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t('totalBusinesses') || (language.trim() === 'en' ? 'Total Businesses' : 'Total de Negocios')}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {businesses.length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t('active')}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {businesses.filter(b => b.isActive && !b.isBlocked).length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t('blocked') || 'Blocked'}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">
                {businesses.filter(b => b.isBlocked).length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {language.trim() === 'en' ? 'Premium' : 'Premium'}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-purple-600">
                {businesses.filter(b => b.isPremium).length}
              </dd>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder={t('searchBusinessesPlaceholder')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">{t('all')}</option>
            <option value="active">{t('active')}</option>
            <option value="blocked">{t('blocked') || 'Blocked'}</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        {/* Businesses Table */}
        <div className="bg-white shadow rounded-lg relative">
          <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('businessLabel') || (language.trim() === 'en' ? 'Business' : 'Negocio')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('contact')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBusinesses.map((business, index) => (
                <tr key={business.id} className={business.isBlocked ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{business.name}</div>
                      <div className="text-sm text-gray-500">{business.city}{business.state ? `, ${business.state}` : ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={business.categoryId || ''}
                      onChange={(e) => handleCategoryChange(business.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={saving}
                    >
                      <option value="">{t('noCategory') || (language.trim() === 'en' ? 'No category' : 'Sin categoría')}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{business.email}</div>
                    <div className="text-sm text-gray-500">{business.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {business.isBlocked ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {(t('blockedUpper') || 'BLOCKED')} - {
                            business.blockedReason 
                              ? (business.blockedReason === 'Non-payment' 
                                ? (t('nonPayment') || 'Non-payment')
                                : business.blockedReason === 'Terms violation'
                                ? (t('termsViolation') || 'Terms violation')
                                : (t('other') || 'Other'))
                              : (t('nonPayment') || 'Non-payment')
                          }
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          business.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {business.isActive 
                            ? t('active')
                            : t('inactive')}
                        </span>
                      )}
                      {business.isPremium && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Premium
                        </span>
                      )}
                      {business.enableStaffModule && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {t('staffModule') || 'Staff Module'}
                        </span>
                      )}
                        {(business as any).enablePackagesModule && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {t('packagesModule') || 'Packages Module'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === business.id ? null : business.id)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                      
                      {openMenuId === business.id && (
                        <div 
                          className={`absolute right-0 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 ${
                            // Abrir hacia arriba solo si es el último elemento Y hay más de 3 elementos
                            // O si está en las últimas 2 filas cuando hay muchos elementos
                            (index === filteredBusinesses.length - 1 && filteredBusinesses.length > 3) ||
                            (filteredBusinesses.length > 10 && index >= filteredBusinesses.length - 2)
                              ? 'bottom-full mb-1' 
                              : 'top-full mt-1'
                          }`}
                          style={{ zIndex: 9999 }}
                        >
                          <div className="py-1">
                            {/* Staff Module Toggle */}
                            <button
                              onClick={async () => {
                                try {
                                  setSaving(true)
                                  const newValue = !business.enableStaffModule
                                  const response = await fetch('/api/admin/businesses', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      id: business.id,
                                      enableStaffModule: newValue
                                    })
                                  })
                                  if (!response.ok) throw new Error('Failed to toggle staff module')
                                  await loadBusinesses()
                                  setOpenMenuId(null)
                                  alert(newValue 
                                    ? (t('staffModuleEnabledSuccess') || 'Staff module enabled successfully')
                                    : (t('staffModuleDisabledSuccess') || 'Staff module disabled successfully')
                                  )
                                } catch (error) {
                                  console.error('Error toggling staff module:', error)
                                  alert(t('failedToggleStaffModule') || 'Failed to toggle staff module')
                                } finally {
                                  setSaving(false)
                                }
                              }}
                              disabled={saving}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Users className={`w-4 h-4 ${business.enableStaffModule ? 'text-blue-600' : 'text-gray-400'}`} />
                              <span className={business.enableStaffModule ? 'text-blue-600' : 'text-gray-700'}>
                                {business.enableStaffModule 
                                  ? (t('disableStaff') || 'Disable Staff')
                                  : (t('enableStaff') || 'Enable Staff')}
                              </span>
                            </button>
                            
                            {/* Packages Module Toggle */}
                            <button
                              onClick={async () => {
                                try {
                                  setSaving(true)
                                    const newValue = !(business as any).enablePackagesModule
                                  const response = await fetch('/api/admin/businesses', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      id: business.id,
                                        enablePackagesModule: newValue
                                    })
                                  })
                                  if (!response.ok) throw new Error('Failed to toggle packages module')
                                  await loadBusinesses()
                                  setOpenMenuId(null)
                                  alert(newValue 
                                    ? (t('packagesModuleEnabledSuccess') || 'Packages module enabled successfully')
                                    : (t('packagesModuleDisabledSuccess') || 'Packages module disabled successfully')
                                  )
                                } catch (error) {
                                  console.error('Error toggling packages module:', error)
                                  alert(t('failedTogglePackagesModule') || 'Failed to toggle packages module')
                                } finally {
                                  setSaving(false)
                                }
                              }}
                              disabled={saving}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3"
                            >
                                <Package className={`w-4 h-4 ${(business as any).enablePackagesModule ? 'text-indigo-600' : 'text-gray-400'}`} />
                                <span className={(business as any).enablePackagesModule ? 'text-indigo-600' : 'text-gray-700'}>
                                  {(business as any).enablePackagesModule 
                                  ? (t('disablePackages') || 'Disable Packages')
                                  : (t('enablePackages') || 'Enable Packages')}
                              </span>
                            </button>
                            
                            <div className="border-t border-gray-100 my-1"></div>
                            
                            {/* Block/Unblock */}
                            {business.isBlocked ? (
                              <button
                                onClick={() => {
                                  handleUnblockBusiness(business)
                                  setOpenMenuId(null)
                                }}
                                disabled={saving}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Unlock className="w-4 h-4 text-green-600" />
                                  <span className="text-green-600">
                                  {t('unblock') || 'Unblock'}
                                  </span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedBusiness(business)
                                  setShowBlockModal(true)
                                  setOpenMenuId(null)
                                }}
                                disabled={saving}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Ban className="w-4 h-4 text-orange-600" />
                                <span className="text-orange-600">
                                  {t('block') || 'Block'}
                                  </span>
                              </button>
                            )}
                            
                            <div className="border-t border-gray-100 my-1"></div>
                            
                            {/* Delete */}
                            <button
                              onClick={() => {
                                handleDeleteBusiness(business)
                                setOpenMenuId(null)
                              }}
                              disabled={saving}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-3"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                              <span className="text-red-600">
                                {t('delete')}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Block Modal */}
        {showBlockModal && selectedBusiness && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {t('blockBusiness') || 'Block Business'}
              </h2>
              <p className="text-gray-600 mb-4">
                {language.trim() === 'en' 
                  ? `Block "${selectedBusiness.name}" from the directory?`
                  : `¿Bloquear "${selectedBusiness.name}" del directorio?`}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('reasonLabel') || 'Reason'}
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                >
                  <option value="payment">
                    {t('nonPayment') || 'Non-payment'}
                  </option>
                  <option value="violation">
                    {t('termsViolation') || 'Terms violation'}
                  </option>
                  <option value="other">
                    {t('other')}
                  </option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowBlockModal(false)
                    setSelectedBusiness(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  onClick={handleBlockBusiness}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {saving 
                    ? (t('blocking') || 'Blocking...')
                    : (t('blockBusiness') || 'Block Business')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

