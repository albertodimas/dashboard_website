'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'
import { useAutoFocusFirstInput } from '@/hooks/useAutoFocusFirstInput'

interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: string
  isActive: boolean
  assignedStaff?: string[] // IDs of assigned staff members
}

interface Staff {
  id: string
  name: string
  isActive: boolean
}

export default function ServicesPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [isPaged, setIsPaged] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    category: 'Hair',
    isActive: true,
    assignedStaff: [] as string[]
  })
  const [formErrors, setFormErrors] = useState<{ name?: string; duration?: string; price?: string; category?: string }>({})
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([])
  const [staffModuleEnabled, setStaffModuleEnabled] = useState(false)
  const addModalRef = useRef<HTMLDivElement>(null)
  const editModalRef = useRef<HTMLDivElement>(null)
  useAutoFocusFirstInput(showAddModal, addModalRef)
  useAutoFocusFirstInput(showEditModal, editModalRef)
  const confirm = useConfirm()
  const toast = useToast()

  const loadServices = async (opts?: { page?: number; category?: string }) => {
    try {
      setLoading(true)
      setError(null)
      const p = opts?.page ?? page
      const cat = opts?.category ?? selectedCategory
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('limit', String(pageSize))
      const q = cat && cat !== 'all' ? cat : ''
      if (q) params.set('q', q)
      const response = await fetch(`/api/dashboard/services?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load services')
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setIsPaged(false)
        setServices(data)
        setTotalPages(Math.max(1, Math.ceil(data.length / pageSize)))
      } else if (data && Array.isArray(data.items)) {
        setIsPaged(true)
        setServices(data.items)
        setPage(data.page || 1)
        setTotalPages(data.totalPages || 1)
      } else {
        setIsPaged(false)
        setServices([])
        setTotalPages(1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(async () => {
        // Load services from API
        loadServices({ page: 1, category: selectedCategory })
        
        // Check if staff module is enabled
        try {
          const businessRes = await fetch('/api/dashboard/business')
          if (businessRes.ok) {
            const businessData = await businessRes.json()
            setStaffModuleEnabled(businessData.enableStaffModule === true)
            
            // If staff module is enabled, load staff
            if (businessData.enableStaffModule) {
              const staffRes = await fetch('/api/dashboard/staff')
              if (staffRes.ok) {
                const staffData = await staffRes.json()
                setAvailableStaff(staffData.filter((s: any) => s.isActive))
              }
            }
          }
        } catch (error) {
          console.error('Error loading business data:', error)
        }
        
        // Load categories from API
        try {
          const categoriesRes = await fetch('/api/dashboard/categories')
          if (categoriesRes.ok) {
            const categories = await categoriesRes.json()
            if (Array.isArray(categories) && categories.length > 0) {
              setAvailableCategories(categories.sort((a: any, b: any) => a.order - b.order).map((c: any) => c.name))
            } else {
              // No categories exist yet
              setAvailableCategories([])
            }
          }
        } catch (error) {
          console.error('Error loading categories:', error)
          setAvailableCategories([])
        }
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])


  const handleAddService = () => {
    setFormData({
      name: '',
      description: '',
      duration: 30,
      price: 0,
      category: availableCategories[0] || 'Other',
      isActive: true,
      assignedStaff: []
    })
    setFormErrors({})
    setShowAddModal(true)
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      category: service.category,
      isActive: service.isActive,
      assignedStaff: service.assignedStaff || []
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleDeleteService = async (serviceId: string) => {
    const ok = await confirm({
      title: t('delete') || 'Delete',
      message: t('deleteServiceConfirm') || 'Are you sure you want to delete this service?',
      confirmText: t('delete') || 'Delete',
      variant: 'danger'
    })
    if (ok) {
      try {
        setSaving(true)
        const response = await fetch(`/api/dashboard/services?id=${serviceId}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error('Failed to delete service')
        }
        await loadServices() // Reload services after deletion
        toast(t('deleted') || 'Deleted', 'success')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete service')
        toast(t('failedToDelete') || 'Failed to delete', 'error')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault()
    // Client-side validation
    const errors: { name?: string; duration?: string; price?: string; category?: string } = {}
    if (!formData.name || formData.name.trim() === '') errors.name = t('fieldRequired') || 'This field is required'
    if (!formData.category || formData.category.trim() === '') errors.category = t('fieldRequired') || 'This field is required'
    if (!formData.duration || formData.duration <= 0) errors.duration = t('mustBeGreaterThanZero') || 'Must be greater than 0'
    if (formData.price < 0) errors.price = t('priceMustBeZeroOrMore') || 'Must be zero or more'
    const nameLower = (formData.name || '').trim().toLowerCase()
    const dupLocal = services.find(s => s.name.trim().toLowerCase() === nameLower && (!showEditModal || s.id !== (editingService?.id)))
    if (dupLocal) errors.name = t('alreadyExists') || 'Already exists'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast(t('validationError') || 'Please correct the highlighted fields', 'error')
      return
    }
    try {
      setSaving(true)
      setError(null)
      
      if (showEditModal && editingService) {
        // Update existing service
        const response = await fetch('/api/dashboard/services', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...formData, id: editingService.id }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          toast(data.error || (t('failedToSaveService') || 'Failed to update service'), 'error')
          return
        }
        setShowEditModal(false)
      } else {
        // Add new service
        const response = await fetch('/api/dashboard/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          toast(data.error || (t('failedToSaveService') || 'Failed to create service'), 'error')
          return
        }
        setShowAddModal(false)
      }
      
      await loadServices() // Reload services after save
    } catch (err) {
      console.error('Save service error:', err)
      toast(t('failedToSaveService') || 'Failed to save service', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (serviceId: string) => {
    try {
      setSaving(true)
      const service = services.find(s => s.id === serviceId)
      if (!service) return
      
      const response = await fetch('/api/dashboard/services', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...service, isActive: !service.isActive }),
      })
      if (!response.ok) {
        throw new Error('Failed to update service status')
      }
      
      await loadServices() // Reload services after update
    } catch (err) {
      console.error('Update service status error:', err)
      toast(t('failedToUpdateService') || 'Failed to update service', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Get unique categories from all services
  const allCategories = ['all', ...new Set(services.map(s => s.category))]
  
  const filteredServices = isPaged ? services : (selectedCategory === 'all' ? services : services.filter(s => s.category === selectedCategory))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold">{t('loading')}</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800">Error Loading Services</h3>
            <p className="text-red-600 mt-2">{error}</p>
            <button 
              onClick={loadServices}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('servicesTitle')}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {t('servicesSubtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/categories"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              {t('manageCategories')}
            </Link>
            <button 
              onClick={handleAddService}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {t('addServiceBtn')}
            </button>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {allCategories.map(category => (
            <button 
              key={category}
              onClick={() => { setSelectedCategory(category); setPage(1); loadServices({ page: 1, category }) }}
              className={`px-4 py-2 rounded-full ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {category === 'all' ? t('all') : category}
            </button>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => { const p = page - 1; setPage(p); loadServices({ page: p }) }}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => { const p = page + 1; setPage(p); loadServices({ page: p }) }}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mt-2">
                      {service.category}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={service.isActive}
                        onChange={() => handleToggleActive(service.id)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                
                {/* Show assigned staff if module is enabled */}
                {staffModuleEnabled && service.assignedStaff && service.assignedStaff.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {t('assignedStaff') + ':'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {service.assignedStaff.map((staffId) => {
                        const staff = availableStaff.find(s => s.id === staffId)
                        return staff ? (
                          <span key={staffId} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {staff.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {service.duration} {t('min')}
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    ${service.price}
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handleEditService(service)}
                    className="flex-1 text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50"
                  >
                    {t('edit')}
                  </button>
                  <button 
                    onClick={() => handleDeleteService(service.id)}
                    className="flex-1 text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-50"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Service Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div ref={editModalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{t('editService')}</h2>
              <form className="space-y-4" onSubmit={handleSaveService}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('serviceName')}</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={formData.name}
                    onChange={(e) => { setFormData({...formData, name: e.target.value}); setFormErrors(fe => ({ ...fe, name: undefined })) }}
                  />
                  {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('description')}</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('durationMinutes')}</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      value={formData.duration}
                      onChange={(e) => { setFormData({...formData, duration: parseInt(e.target.value) || 0}); setFormErrors(fe => ({ ...fe, duration: undefined })) }}
                    />
                    {formErrors.duration && <p className="text-xs text-red-600 mt-1">{formErrors.duration}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('priceAmount')}</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      value={formData.price}
                      onChange={(e) => { setFormData({...formData, price: parseFloat(e.target.value) || 0}); setFormErrors(fe => ({ ...fe, price: undefined })) }}
                    />
                    {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('category')}</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={formData.category}
                    onChange={(e) => { setFormData({...formData, category: e.target.value}); setFormErrors(fe => ({ ...fe, category: undefined })) }}
                    required
                  >
                    <option value="">{t('selectCategory')}</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {formErrors.category && <p className="text-xs text-red-600 mt-1">{formErrors.category}</p>}
                </div>
                {/* Staff Assignment (if module is enabled) */}
                {staffModuleEnabled && availableStaff.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('assignedStaff')}
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {availableStaff.map(staff => (
                        <label key={staff.id} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={formData.assignedStaff.includes(staff.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({...formData, assignedStaff: [...formData.assignedStaff, staff.id]})
                              } else {
                                setFormData({...formData, assignedStaff: formData.assignedStaff.filter(id => id !== staff.id)})
                              }
                            }}
                          />
                          <span className="text-sm">{staff.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? t('saving') : t('saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Service Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div ref={addModalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{t('addNewService')}</h2>
              <form className="space-y-4" onSubmit={handleSaveService}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('serviceName')}</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="e.g., Premium Haircut"
                    value={formData.name}
                    onChange={(e) => { setFormData({...formData, name: e.target.value}); setFormErrors(fe => ({ ...fe, name: undefined })) }}
                  />
                  {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('description')}</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    rows={3}
                    placeholder="Describe the service..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('durationMinutes')}</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      placeholder="30"
                      value={formData.duration}
                      onChange={(e) => { setFormData({...formData, duration: parseInt(e.target.value) || 0}); setFormErrors(fe => ({ ...fe, duration: undefined })) }}
                    />
                    {formErrors.duration && <p className="text-xs text-red-600 mt-1">{formErrors.duration}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('priceAmount')}</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      placeholder="35"
                      value={formData.price}
                      onChange={(e) => { setFormData({...formData, price: parseFloat(e.target.value) || 0}); setFormErrors(fe => ({ ...fe, price: undefined })) }}
                    />
                    {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('category')}</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={formData.category}
                    onChange={(e) => { setFormData({...formData, category: e.target.value}); setFormErrors(fe => ({ ...fe, category: undefined })) }}
                    required
                  >
                    <option value="">{t('selectCategory')}</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {formErrors.category && <p className="text-xs text-red-600 mt-1">{formErrors.category}</p>}
                </div>
                {/* Staff Assignment (if module is enabled) */}
                {staffModuleEnabled && availableStaff.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('assignedStaff')}
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {availableStaff.map(staff => (
                        <label key={staff.id} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={formData.assignedStaff.includes(staff.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({...formData, assignedStaff: [...formData.assignedStaff, staff.id]})
                              } else {
                                setFormData({...formData, assignedStaff: formData.assignedStaff.filter(id => id !== staff.id)})
                              }
                            }}
                          />
                          <span className="text-sm">{staff.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? t('adding') : t('addService')}
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
