'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'
import GroupedPurchasesView from '@/components/GroupedPurchasesView'

export default function PackagePurchasesPage() {
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'all'>('pending')
  const [viewMode, setViewMode] = useState<'detailed' | 'grouped'>('grouped')
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())
  const [customers, setCustomers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null)
  const [formData, setFormData] = useState({
    customerId: '',
    packageId: '',
    paymentMethod: 'CASH'
  })
  const [activationData, setActivationData] = useState({
    paymentConfirmed: false,
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load customers
      const custResponse = await fetch('/api/dashboard/customers')
      if (custResponse.ok) {
        const custData = await custResponse.json()
        setCustomers(Array.isArray(custData) ? custData : [])
      }

      // Load packages
      const pkgResponse = await fetch('/api/dashboard/packages')
      if (pkgResponse.ok) {
        const pkgData = await pkgResponse.json()
        setPackages(Array.isArray(pkgData) ? pkgData : [])
      }

      // Load existing purchases
      const purchResponse = await fetch('/api/dashboard/package-purchases')
      if (purchResponse.ok) {
        const purchData = await purchResponse.json()
        setPurchases(Array.isArray(purchData) ? purchData : [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/packages/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'ACTIVE' // Manual creation from dashboard is already active
        })
      })

      if (response.ok) {
        setShowAddModal(false)
        setFormData({ customerId: '', packageId: '', paymentMethod: 'CASH' })
        await loadData()
        alert(language === 'en' ? 'Package purchase registered successfully!' : '¡Compra de paquete registrada exitosamente!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to register purchase')
      }
    } catch (error) {
      alert('Error registering purchase')
    }
    setLoading(false)
  }

  const handleActivatePurchase = async () => {
    if (!selectedPurchase || !activationData.paymentConfirmed) {
      alert(language === 'en' ? 'Please confirm payment receipt' : 'Por favor confirme la recepción del pago')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/package-purchases/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: selectedPurchase.id,
          notes: activationData.notes
        })
      })

      if (response.ok) {
        setShowActivateModal(false)
        setSelectedPurchase(null)
        setActivationData({ paymentConfirmed: false, notes: '' })
        await loadData()
        alert(language === 'en' ? 'Package activated successfully!' : '¡Paquete activado exitosamente!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to activate package')
      }
    } catch (error) {
      alert('Error activating package')
    }
    setLoading(false)
  }

  const filteredPurchases = purchases.filter(purchase => {
    if (activeTab === 'pending') return purchase.status === 'PENDING'
    if (activeTab === 'active') return purchase.status === 'ACTIVE'
    return true
  })

  // Group purchases by customer for grouped view
  const groupedByCustomer = filteredPurchases.reduce((acc: any, purchase: any) => {
    const customerId = purchase.customerId
    if (!acc[customerId]) {
      acc[customerId] = {
        customer: purchase.customer,
        purchases: []
      }
    }
    acc[customerId].purchases.push(purchase)
    return acc
  }, {})

  const toggleExpandedCustomer = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers)
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId)
    } else {
      newExpanded.add(customerId)
    }
    setExpandedCustomers(newExpanded)
  }

  // Calculate statistics
  const stats = {
    totalPurchases: purchases.length,
    pendingPurchases: purchases.filter(p => p.status === 'PENDING').length,
    activePurchases: purchases.filter(p => p.status === 'ACTIVE').length,
    totalRevenue: purchases
      .filter(p => p.status === 'ACTIVE' || p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.pricePaid, 0),
    totalSessions: purchases
      .filter(p => p.status === 'ACTIVE')
      .reduce((sum, p) => sum + p.remainingSessions, 0)
  }

  if (loading && purchases.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">
            {language === 'en' ? 'Loading...' : 'Cargando...'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'en' ? 'Package Purchases' : 'Compras de Paquetes'}
          </h1>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition ${
                  viewMode === 'grouped'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {language === 'en' ? 'By Customer' : 'Por Cliente'}
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition ${
                  viewMode === 'detailed'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {language === 'en' ? 'Detailed' : 'Detallado'}
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {language === 'en' ? '+ Manual Purchase' : '+ Compra Manual'}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">
              {language === 'en' ? 'Total Purchases' : 'Compras Totales'}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <div className="text-sm text-yellow-600">
              {language === 'en' ? 'Pending Activation' : 'Pendientes'}
            </div>
            <div className="text-2xl font-bold text-yellow-700">{stats.pendingPurchases}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-600">
              {language === 'en' ? 'Active Packages' : 'Paquetes Activos'}
            </div>
            <div className="text-2xl font-bold text-green-700">{stats.activePurchases}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-sm text-blue-600">
              {language === 'en' ? 'Available Sessions' : 'Sesiones Disponibles'}
            </div>
            <div className="text-2xl font-bold text-blue-700">{stats.totalSessions}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow">
            <div className="text-sm text-purple-600">
              {language === 'en' ? 'Total Revenue' : 'Ingresos Totales'}
            </div>
            <div className="text-2xl font-bold text-purple-700">${stats.totalRevenue.toFixed(2)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'en' ? 'Pending Activation' : 'Pendientes de Activación'}
              {stats.pendingPurchases > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  {stats.pendingPurchases}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'en' ? 'Active Packages' : 'Paquetes Activos'}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'en' ? 'All Purchases' : 'Todas las Compras'}
            </button>
          </nav>
        </div>

        {/* Purchases View - Grouped or Detailed */}
        {viewMode === 'grouped' ? (
          <GroupedPurchasesView 
            groupedByCustomer={groupedByCustomer}
            language={language}
            onActivatePurchase={(purchase) => {
              setSelectedPurchase(purchase)
              setShowActivateModal(true)
            }}
          />
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Customer' : 'Cliente'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Package' : 'Paquete'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Sessions' : 'Sesiones'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Price' : 'Precio'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Status' : 'Estado'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Date' : 'Fecha'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Actions' : 'Acciones'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.customer?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {purchase.customer?.email}
                      </div>
                      {purchase.customer?.phone && (
                        <div className="text-xs text-gray-400">
                          {purchase.customer?.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{purchase.package?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {purchase.status === 'PENDING' ? (
                        <span className="text-gray-500">{purchase.totalSessions} sessions</span>
                      ) : (
                        <>
                          {purchase.usedSessions}/{purchase.totalSessions}
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(purchase.usedSessions / purchase.totalSessions) * 100}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${purchase.pricePaid}</div>
                    {purchase.paymentMethod && (
                      <div className="text-xs text-gray-500">{purchase.paymentMethod}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      purchase.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      purchase.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      purchase.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                      purchase.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {purchase.status}
                    </span>
                    {purchase.paymentStatus === 'PENDING' && (
                      <div className="text-xs text-orange-600 mt-1">
                        Payment Pending
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                    {purchase.expiryDate && (
                      <div className="text-xs text-gray-400">
                        Expires: {new Date(purchase.expiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {purchase.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          setSelectedPurchase(purchase)
                          setShowActivateModal(true)
                        }}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        {language === 'en' ? 'Activate' : 'Activar'}
                      </button>
                    )}
                    <button
                      onClick={() => console.log('View details', purchase.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {language === 'en' ? 'Details' : 'Detalles'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Add Purchase Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {language === 'en' ? 'Manual Package Purchase' : 'Compra Manual de Paquete'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Customer' : 'Cliente'}
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="">{language === 'en' ? 'Select customer' : 'Seleccionar cliente'}</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Package' : 'Paquete'}
                  </label>
                  <select
                    value={formData.packageId}
                    onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="">{language === 'en' ? 'Select package' : 'Seleccionar paquete'}</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - ${pkg.price} ({pkg.sessionCount} sessions)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Payment Method' : 'Método de Pago'}
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="CASH">{language === 'en' ? 'Cash' : 'Efectivo'}</option>
                    <option value="CARD">{language === 'en' ? 'Card' : 'Tarjeta'}</option>
                    <option value="TRANSFER">{language === 'en' ? 'Transfer' : 'Transferencia'}</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? '...' : language === 'en' ? 'Register Purchase' : 'Registrar Compra'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Activate Package Modal */}
        {showActivateModal && selectedPurchase && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {language === 'en' ? 'Activate Package Purchase' : 'Activar Compra de Paquete'}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Customer:</div>
                <div className="font-medium">{selectedPurchase.customer?.name}</div>
                <div className="text-sm text-gray-500">{selectedPurchase.customer?.email}</div>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Package:</div>
                <div className="font-medium">{selectedPurchase.package?.name}</div>
                <div className="text-sm text-gray-500">
                  {selectedPurchase.totalSessions} sessions - ${selectedPurchase.pricePaid}
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activationData.paymentConfirmed}
                    onChange={(e) => setActivationData({ 
                      ...activationData, 
                      paymentConfirmed: e.target.checked 
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'en' 
                      ? 'I confirm that payment has been received' 
                      : 'Confirmo que el pago ha sido recibido'}
                  </span>
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'Notes (optional)' : 'Notas (opcional)'}
                </label>
                <textarea
                  value={activationData.notes}
                  onChange={(e) => setActivationData({ 
                    ...activationData, 
                    notes: e.target.value 
                  })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder={language === 'en' 
                    ? 'Payment confirmation details...' 
                    : 'Detalles de confirmación del pago...'}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowActivateModal(false)
                    setSelectedPurchase(null)
                    setActivationData({ paymentConfirmed: false, notes: '' })
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  onClick={handleActivatePurchase}
                  disabled={loading || !activationData.paymentConfirmed}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? '...' : language === 'en' ? 'Activate Package' : 'Activar Paquete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}