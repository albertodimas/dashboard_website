'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'

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
    price: 0,
    discount: 0,
    isActive: true,
    validityDays: '',
    maxPurchases: '',
    displayOrder: 0,
    sessionCount: 1, // Number of sessions included in the package
    services: [] as PackageService[]
  })

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
    
    const packageData = {
      ...formData,
      price: Number(formData.price),
      discount: Number(formData.discount) || null,
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
    if (!confirm(language === 'en' ? 'Delete this package?' : '¿Eliminar este paquete?')) {
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
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      discount: pkg.discount || 0,
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
      price: 0,
      discount: 0,
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
            <h1 className="text-3xl font-bold text-gray-900">
              {language === 'en' ? 'Service Packages' : 'Paquetes de Servicios'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {language === 'en' 
                ? 'Create special offers by bundling services together'
                : 'Crea ofertas especiales agrupando servicios'}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {language === 'en' ? '+ New Package' : '+ Nuevo Paquete'}
          </button>
        </div>

        {/* Formulario de paquete */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingPackage 
                ? (language === 'en' ? 'Edit Package' : 'Editar Paquete')
                : (language === 'en' ? 'New Package' : 'Nuevo Paquete')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'Package Name' : 'Nombre del Paquete'}
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
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'Price' : 'Precio'}
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {language === 'en' ? 'Description' : 'Descripción'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'Sessions Included' : 'Sesiones Incluidas'}
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
                    {language === 'en' ? 'Discount %' : '% Descuento'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value)})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'Validity (days)' : 'Validez (días)'}
                  </label>
                  <input
                    type="number"
                    value={formData.validityDays}
                    onChange={(e) => setFormData({...formData, validityDays: e.target.value})}
                    placeholder={language === 'en' ? 'Optional' : 'Opcional'}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'Max purchases' : 'Máx. compras'}
                  </label>
                  <input
                    type="number"
                    value={formData.maxPurchases}
                    onChange={(e) => setFormData({...formData, maxPurchases: e.target.value})}
                    placeholder={language === 'en' ? 'Optional' : 'Opcional'}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Selección de servicios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'Services in Package' : 'Servicios en el Paquete'}
                </label>
                
                {/* Servicios disponibles */}
                <div className="border border-gray-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {language === 'en' ? 'Available Services' : 'Servicios Disponibles'}
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
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      {language === 'en' ? 'Selected Services' : 'Servicios Seleccionados'}
                    </p>
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
                        <span>{language === 'en' ? 'Original Value:' : 'Valor Original:'}</span>
                        <span className="font-medium">${calculateOriginalPrice().toFixed(2)}</span>
                      </div>
                      {formData.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>{language === 'en' ? 'Savings:' : 'Ahorro:'}</span>
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
                  {language === 'en' ? 'Active' : 'Activo'}
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPackage 
                    ? (language === 'en' ? 'Update' : 'Actualizar')
                    : (language === 'en' ? 'Create' : 'Crear')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de paquetes */}
        <div className="grid gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{pkg.name}</h3>
                    {!pkg.isActive && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {language === 'en' ? 'Inactive' : 'Inactivo'}
                      </span>
                    )}
                    {pkg.discount && pkg.discount > 0 && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        {pkg.discount}% OFF
                      </span>
                    )}
                  </div>
                  
                  {pkg.description && (
                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                  )}
                  
                  <div className="mt-3 flex items-center gap-4">
                    <div>
                      <span className="text-2xl font-bold text-blue-600">${pkg.price}</span>
                      {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          ${pkg.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <span>{language === 'en' ? 'Duration:' : 'Duración:'} {pkg.duration} min</span>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <span>{language === 'en' ? 'Sessions:' : 'Sesiones:'} {pkg.sessionCount || 1}</span>
                    </div>
                    
                    {pkg.validityDays && (
                      <div className="text-sm text-gray-500">
                        <span>{language === 'en' ? 'Valid for:' : 'Válido por:'} {pkg.validityDays} {language === 'en' ? 'days' : 'días'}</span>
                      </div>
                    )}
                  </div>
                  
                  {pkg.services.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {language === 'en' ? 'Includes:' : 'Incluye:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {pkg.services.map(ps => (
                          <span key={ps.serviceId} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {ps.quantity}x {ps.service?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    {language === 'en' ? 'Edit' : 'Editar'}
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    {language === 'en' ? 'Delete' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {packages.length === 0 && !showForm && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">
              {language === 'en' 
                ? 'No packages created yet. Create your first package to offer special deals!'
                : '¡No hay paquetes creados. Crea tu primer paquete para ofrecer ofertas especiales!'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}