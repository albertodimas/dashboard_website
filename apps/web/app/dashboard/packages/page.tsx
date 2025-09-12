'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'
import { formatPrice, formatCurrency, formatDiscount } from '@/lib/format-utils'

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

interface PackageService {
  serviceId: string
  quantity: number
  service?: Service
}

interface Package {
  id: string
  name: string
  description: string | null
  price: number
  originalPrice: number | null
  discount: number | null
  duration: number
  isActive: boolean
  validityDays: number | null
  maxPurchases: number | null
  displayOrder: number
  services: PackageService[]
}

export default function PackagesPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [packages, setPackages] = useState<Package[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount: 0,
    price: 0, // Final price that can be manually adjusted
    isActive: true,
    validityDays: '',
    maxPurchases: '',
    displayOrder: 0,
    sessionCount: 1, // Number of sessions included in the package
    services: [] as PackageService[]
  })
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPackages()
    fetchServices()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/dashboard/packages')
      if (response.ok) {
        const data = await response.json()
        setPackages(data)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/dashboard/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Calculate price based on services and discount
    const originalPrice = calculateOriginalPrice()
    const finalPrice = formData.price || calculateFinalPrice()
    
    const packageData = {
      ...formData,
      price: parseFloat(finalPrice.toFixed(2)),
      originalPrice: originalPrice,
      discount: Math.round(formData.discount) || null,
      validityDays: formData.validityDays ? Number(formData.validityDays) : null,
      maxPurchases: formData.maxPurchases ? Number(formData.maxPurchases) : null,
      displayOrder: Number(formData.displayOrder)
    }

    try {
      const url = editingPackage 
        ? `/api/dashboard/packages?id=${editingPackage.id}`
        : '/api/dashboard/packages'
      
      const response = await fetch(url, {
        method: editingPackage ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
      })

      if (response.ok) {
        fetchPackages()
        resetForm()
      }
    } catch (error) {
      console.error('Error saving package:', error)
    }
  }

  const handleDelete = async (packageId: string) => {
    // Check if currently editing
    if (editingPackage) {
      alert(t('finishCurrentBeforeOtherActions'))
      return
    }
    
    if (!confirm(t('deleteConfirm'))){
      return
    }

    try {
      const response = await fetch(`/api/dashboard/packages?id=${packageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPackages()
      }
    } catch (error) {
      console.error('Error deleting package:', error)
    }
  }

  const handleEdit = (pkg: Package) => {
    // Check if currently editing another package
    if (editingPackage && editingPackage.id !== pkg.id) {
      alert(t('finishCurrentBeforeEditingAnother'))
      return
    }
    
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      discount: Math.round(pkg.discount || 0),
      price: parseFloat(pkg.price.toFixed(2)),
      isActive: pkg.isActive,
      validityDays: pkg.validityDays?.toString() || '',
      maxPurchases: pkg.maxPurchases?.toString() || '',
      displayOrder: pkg.displayOrder,
      sessionCount: (pkg as any).sessionCount || 1,
      services: pkg.services.map(s => ({
        serviceId: s.serviceId,
        quantity: s.quantity
      }))
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount: 0,
      price: 0,
      isActive: true,
      validityDays: '',
      maxPurchases: '',
      displayOrder: 0,
      sessionCount: 1,
      services: []
    })
    setEditingPackage(null)
    setShowForm(false)
  }

  const togglePackageExpansion = (packageId: string) => {
    setExpandedPackages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(packageId)) {
        newSet.delete(packageId)
      } else {
        newSet.add(packageId)
      }
      return newSet
    })
  }

  const addServiceToPackage = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return

    const existing = formData.services.find(s => s.serviceId === serviceId)
    if (existing) {
      // Incrementar cantidad
      setFormData({
        ...formData,
        services: formData.services.map(s => 
          s.serviceId === serviceId 
            ? { ...s, quantity: s.quantity + 1 }
            : s
        )
      })
    } else {
      // Agregar nuevo servicio
      setFormData({
        ...formData,
        services: [...formData.services, { serviceId, quantity: 1, service }]
      })
    }
  }

  const removeServiceFromPackage = (serviceId: string) => {
    setFormData({
      ...formData,
      services: formData.services.filter(s => s.serviceId !== serviceId)
    })
  }

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeServiceFromPackage(serviceId)
    } else {
      setFormData({
        ...formData,
        services: formData.services.map(s => 
          s.serviceId === serviceId 
            ? { ...s, quantity }
            : s
        )
      })
    }
  }

  const calculateOriginalPrice = () => {
    let total = 0
    formData.services.forEach(ps => {
      const service = services.find(s => s.id === ps.serviceId)
      if (service) {
        total += service.price * ps.quantity
      }
    })
    return total
  }

  const calculateFinalPrice = () => {
    const originalPrice = calculateOriginalPrice()
    const discountAmount = (formData.discount / 100) * originalPrice
    return parseFloat((originalPrice - discountAmount).toFixed(2))
  }

  // Update price when discount changes
  const handleDiscountChange = (discount: number) => {
    const roundedDiscount = Math.round(Math.max(0, Math.min(100, discount)))
    const originalPrice = calculateOriginalPrice()
    const newPrice = parseFloat((originalPrice * (1 - roundedDiscount / 100)).toFixed(2))
    
    setFormData({
      ...formData,
      discount: roundedDiscount,
      price: newPrice
    })
  }

  // Update discount when price changes
  const handlePriceChange = (price: number) => {
    const originalPrice = calculateOriginalPrice()
    if (originalPrice > 0) {
      const calculatedDiscount = ((originalPrice - price) / originalPrice) * 100
      const roundedDiscount = Math.round(Math.max(0, Math.min(100, calculatedDiscount)))
      
      setFormData({
        ...formData,
        price: parseFloat(price.toFixed(2)),
        discount: roundedDiscount
      })
    } else {
      setFormData({
        ...formData,
        price: parseFloat(price.toFixed(2))
      })
    }
  }

  // Update price when services change
  useEffect(() => {
    if (formData.services.length > 0) {
      const originalPrice = calculateOriginalPrice()
      const newPrice = parseFloat((originalPrice * (1 - formData.discount / 100)).toFixed(2))
      setFormData(prev => ({
        ...prev,
        price: newPrice
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        price: 0
      }))
    }
  }, [formData.services])

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
        <div className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('servicePackages')}</h1>
            <p className="mt-2 text-sm text-gray-600">{t('createSpecialOffersDesc')}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
                {t('newPackageBtn')}
          </button>
        </div>

        {/* Formulario de paquete */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingPackage ? t('editPackageTitle') : t('newPackageTitle')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('packageName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('discountPercent')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('finalPrice')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                      className="mt-1 block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                      disabled={formData.services.length === 0}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t('descriptionTitle')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('sessionsIncluded')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.sessionCount}
                    onChange={(e) => setFormData({...formData, sessionCount: parseInt(e.target.value) || 1})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('validityDays')}
                  </label>
                  <input
                    type="number"
                    value={formData.validityDays}
                    onChange={(e) => setFormData({...formData, validityDays: e.target.value})}
                    placeholder={t('optional')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('maxPurchases')}
                  </label>
                  <input
                    type="number"
                    value={formData.maxPurchases}
                    onChange={(e) => setFormData({...formData, maxPurchases: e.target.value})}
                    placeholder={t('optional')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Price calculation display */}
              {formData.services.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">
                    {t('servicesTotal')}
                      </span>
                      <span className="ml-2 font-semibold text-gray-900">
                        ${calculateOriginalPrice().toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">
                    {t('discountApplied')}
                      </span>
                      <span className="ml-2 font-semibold text-red-600">
                        {formData.discount}% (${(calculateOriginalPrice() * formData.discount / 100).toFixed(2)})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">
                    {t('packagePrice')}
                      </span>
                      <span className="ml-2 font-bold text-green-600 text-lg">
                        ${formData.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {t('tipAdjustDiscount')}
                  </div>
                </div>
              )}

              {/* Selección de servicios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('servicesInPackage')}
                </label>
                
                {/* Servicios disponibles */}
                <div className="border border-gray-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {t('availableServices')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {services.map(service => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => addServiceToPackage(service.id)}
                        className="text-left p-2 hover:bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex justify-between">
                          <span className="text-sm">{service.name}</span>
                          <span className="text-sm text-gray-500">${service.price}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Servicios seleccionados */}
                {formData.services.length > 0 && (
                  <div className="border border-blue-200 bg-blue-50 rounded-md p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">{t('selectedServices')}</p>
                    <div className="space-y-2">
                      {formData.services.map(ps => {
                        const service = services.find(s => s.id === ps.serviceId)
                        return service ? (
                          <div key={ps.serviceId} className="flex items-center justify-between bg-white p-2 rounded">
                            <span className="text-sm">{service.name}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateServiceQuantity(ps.serviceId, ps.quantity - 1)}
                                className="px-2 py-1 bg-gray-200 rounded"
                              >
                                -
                              </button>
                              <span className="text-sm font-medium">{ps.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateServiceQuantity(ps.serviceId, ps.quantity + 1)}
                                className="px-2 py-1 bg-gray-200 rounded"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => removeServiceFromPackage(ps.serviceId)}
                                className="ml-2 text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ) : null
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex justify-between text-sm">
                        <span>{t('originalValue')}</span>
                        <span className="font-medium">${calculateOriginalPrice().toFixed(2)}</span>
                      </div>
                      {formData.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>{t('savings')}</span>
                          <span className="font-medium">
                            ${(calculateOriginalPrice() * formData.discount / 100).toFixed(2)} ({formData.discount}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  {t('active')}
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPackage 
                    ? t('saveChanges')
                    : t('create')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  {t('cancelBtn')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de paquetes */}
        {editingPackage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">{(t('currentlyEditing') || 'Currently Editing')}: "{editingPackage.name}"</p>
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white shadow-lg rounded-xl overflow-hidden flex flex-col h-full">
              {/* Header con descuento */}
              {pkg.discount && pkg.discount > 0 && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-2">
                  <span className="font-bold text-sm">{Math.round(pkg.discount)}% {t('discountUpper')}</span>
                </div>
              )}
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex-1">
                  {/* Title and Status */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                      {!pkg.isActive && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {t('inactive')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {pkg.description || t('specialOffersLower')}
                  </p>
                  
                  {/* Price Section */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                          <span className="text-sm text-gray-500 line-through block">
                            ${typeof pkg.originalPrice === 'number' ? pkg.originalPrice.toFixed(2) : pkg.originalPrice}
                          </span>
                        )}
                        <span className="text-3xl font-bold text-blue-600">
                          ${typeof pkg.price === 'number' ? pkg.price.toFixed(2) : pkg.price}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-700">{pkg.sessionCount || 1}</div>
                        <div className="text-xs text-gray-500">{t('sessionsLower')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Package Details */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">{pkg.duration} min</span>
                    </div>
                    {pkg.validityDays && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600">{pkg.validityDays} {t('daysLower')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Services List - Grid Layout when expanded */}
                  {pkg.services.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">{t('includedServices')}</p>
                      <div className={`${expandedPackages.has(pkg.id) 
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48' 
                        : 'space-y-1 max-h-24'} overflow-y-auto custom-scrollbar transition-all duration-300`}>
                        {(expandedPackages.has(pkg.id) ? pkg.services : pkg.services.slice(0, 3)).map(ps => (
                          <div key={ps.serviceId} className={`flex items-center justify-between text-sm ${
                            expandedPackages.has(pkg.id) ? 'bg-gray-50 rounded-lg p-2' : ''
                          }`}>
                            <span className="text-gray-600 truncate flex-1 text-xs">{ps.service?.name}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">
                              {ps.quantity}x
                            </span>
                          </div>
                        ))}
                      </div>
                      {pkg.services.length > 3 && (
                        <button
                          onClick={() => togglePackageExpansion(pkg.id)}
                          className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium pt-2 flex items-center justify-center gap-1 transition-colors"
                        >
                          {expandedPackages.has(pkg.id) ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              {t('showLess')}
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {t('showMoreNServices').replace('{n}', String(pkg.services.length - 3))}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t mt-auto">
                  {editingPackage && editingPackage.id === pkg.id ? (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                      {t('currentlyEditing')}
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(pkg)}
                        disabled={editingPackage !== null && editingPackage.id !== pkg.id}
                        className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                          editingPackage && editingPackage.id !== pkg.id
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={editingPackage && editingPackage.id !== pkg.id 
                          ? t('finishEditingFirst')
                          : undefined}
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        disabled={editingPackage !== null}
                        className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                          editingPackage
                            ? 'bg-red-100 text-red-400 cursor-not-allowed'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                        title={editingPackage 
                          ? t('finishEditingFirst')
                          : undefined}
                      >
                        {t('delete')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {packages.length === 0 && !showForm && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">
              {t('noPackagesYet')}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
