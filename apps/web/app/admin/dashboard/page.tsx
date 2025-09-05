'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { Settings } from 'lucide-react'

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
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [saving, setSaving] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [blockReason, setBlockReason] = useState('payment')
  const [categories, setCategories] = useState<Category[]>([])

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
      alert(t('language') === 'en' ? 'Failed to block business' : 'Error al bloquear negocio')
    } finally {
      setSaving(false)
    }
  }

  const handleUnblockBusiness = async (business: Business) => {
    if (confirm(t('language') === 'en' 
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
        alert(t('language') === 'en' ? 'Failed to unblock business' : 'Error al desbloquear negocio')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleDeleteBusiness = async (business: Business) => {
    const confirmMsg = t('language') === 'en' 
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
        alert(t('language') === 'en' ? 'Failed to delete business' : 'Error al eliminar negocio')
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
      alert(t('language') === 'en' 
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
              <h1 className="text-xl font-bold">
                {t('language') === 'en' ? 'Directory Administrator' : 'Administrador del Directorio'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/categories"
                className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-1 border border-gray-600 rounded hover:border-gray-400"
              >
                <Settings className="w-4 h-4" />
                {t('language') === 'en' ? 'Categories' : 'Categorías'}
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
            {t('language') === 'en' ? 'Business Directory Management' : 'Gestión del Directorio de Negocios'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('language') === 'en' 
              ? 'Manage business accounts, payments, and directory visibility'
              : 'Gestiona cuentas de negocios, pagos y visibilidad en el directorio'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t('language') === 'en' ? 'Total Businesses' : 'Total de Negocios'}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {businesses.length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t('language') === 'en' ? 'Active' : 'Activos'}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {businesses.filter(b => b.isActive && !b.isBlocked).length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t('language') === 'en' ? 'Blocked' : 'Bloqueados'}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">
                {businesses.filter(b => b.isBlocked).length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t('language') === 'en' ? 'Premium' : 'Premium'}
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
            placeholder={t('language') === 'en' ? 'Search businesses...' : 'Buscar negocios...'}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">{t('language') === 'en' ? 'All' : 'Todos'}</option>
            <option value="active">{t('language') === 'en' ? 'Active' : 'Activos'}</option>
            <option value="blocked">{t('language') === 'en' ? 'Blocked' : 'Bloqueados'}</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        {/* Businesses Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('language') === 'en' ? 'Business' : 'Negocio'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('language') === 'en' ? 'Category' : 'Categoría'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('language') === 'en' ? 'Contact' : 'Contacto'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('language') === 'en' ? 'Status' : 'Estado'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('language') === 'en' ? 'Actions' : 'Acciones'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBusinesses.map((business) => (
                <tr key={business.id} className={business.isBlocked ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{business.name}</div>
                      <div className="text-sm text-gray-500">{business.city}, {business.state}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={business.categoryId || ''}
                      onChange={(e) => handleCategoryChange(business.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={saving}
                    >
                      <option value="">Sin categoría</option>
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
                          {t('language') === 'en' ? 'BLOCKED' : 'BLOQUEADO'} - {
                            business.blockedReason 
                              ? (business.blockedReason === 'Non-payment' 
                                ? (t('language') === 'en' ? 'Non-payment' : 'Falta de pago')
                                : business.blockedReason === 'Terms violation'
                                ? (t('language') === 'en' ? 'Terms violation' : 'Violación de términos')
                                : (t('language') === 'en' ? 'Other' : 'Otro'))
                              : (t('language') === 'en' ? 'Non-payment' : 'Falta de pago')
                          }
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          business.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {business.isActive 
                            ? (t('language') === 'en' ? 'Active' : 'Activo')
                            : (t('language') === 'en' ? 'Inactive' : 'Inactivo')}
                        </span>
                      )}
                      {business.isPremium && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Premium
                        </span>
                      )}
                      {business.enableStaffModule && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {t('language') === 'en' ? 'Staff Module' : 'Módulo Staff'}
                        </span>
                      )}
                      {business.enablePackagesModule && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {t('language') === 'en' ? 'Packages Module' : 'Módulo Paquetes'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
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
                            // Show success message
                            alert(
                              newValue 
                                ? (t('language') === 'en' ? 'Staff module enabled successfully' : 'Módulo de staff habilitado exitosamente')
                                : (t('language') === 'en' ? 'Staff module disabled successfully' : 'Módulo de staff deshabilitado exitosamente')
                            )
                          } catch (error) {
                            console.error('Error toggling staff module:', error)
                            alert(t('language') === 'en' ? 'Failed to toggle staff module' : 'Error al cambiar el módulo de staff')
                          } finally {
                            setSaving(false)
                          }
                        }}
                        disabled={saving}
                        className={`text-sm ${business.enableStaffModule ? 'text-blue-600 hover:text-blue-900' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        {business.enableStaffModule 
                          ? (t('language') === 'en' ? 'Disable Staff' : 'Desactivar Staff')
                          : (t('language') === 'en' ? 'Enable Staff' : 'Activar Staff')}
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            setSaving(true)
                            const newValue = !business.enablePackagesModule
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
                            // Show success message
                            alert(
                              newValue 
                                ? (t('language') === 'en' ? 'Packages module enabled successfully' : 'Módulo de paquetes habilitado exitosamente')
                                : (t('language') === 'en' ? 'Packages module disabled successfully' : 'Módulo de paquetes deshabilitado exitosamente')
                            )
                          } catch (error) {
                            console.error('Error toggling packages module:', error)
                            alert(t('language') === 'en' ? 'Failed to toggle packages module' : 'Error al cambiar el módulo de paquetes')
                          } finally {
                            setSaving(false)
                          }
                        }}
                        disabled={saving}
                        className={`text-sm ${business.enablePackagesModule ? 'text-indigo-600 hover:text-indigo-900' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        {business.enablePackagesModule 
                          ? (t('language') === 'en' ? 'Disable Packages' : 'Desactivar Paquetes')
                          : (t('language') === 'en' ? 'Enable Packages' : 'Activar Paquetes')}
                      </button>
                      {business.isBlocked ? (
                        <button 
                          onClick={() => handleUnblockBusiness(business)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-900"
                        >
                          {t('language') === 'en' ? 'Unblock' : 'Desbloquear'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setSelectedBusiness(business)
                            setShowBlockModal(true)
                          }}
                          disabled={saving}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          {t('language') === 'en' ? 'Block' : 'Bloquear'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteBusiness(business)}
                        disabled={saving}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('language') === 'en' ? 'Delete' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Block Modal */}
        {showBlockModal && selectedBusiness && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {t('language') === 'en' ? 'Block Business' : 'Bloquear Negocio'}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('language') === 'en' 
                  ? `Block "${selectedBusiness.name}" from the directory?`
                  : `¿Bloquear "${selectedBusiness.name}" del directorio?`}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('language') === 'en' ? 'Reason' : 'Razón'}
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                >
                  <option value="payment">
                    {t('language') === 'en' ? 'Non-payment' : 'Falta de pago'}
                  </option>
                  <option value="violation">
                    {t('language') === 'en' ? 'Terms violation' : 'Violación de términos'}
                  </option>
                  <option value="other">
                    {t('language') === 'en' ? 'Other' : 'Otro'}
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
                  {t('language') === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  onClick={handleBlockBusiness}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {saving 
                    ? (t('language') === 'en' ? 'Blocking...' : 'Bloqueando...')
                    : (t('language') === 'en' ? 'Block Business' : 'Bloquear Negocio')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}