'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalVisits: number
  totalSpent: number
  lastVisit: string
  status: 'active' | 'inactive'
  packagePurchases?: PackagePurchase[]
}

interface PackagePurchase {
  id: string
  packageId: string
  package: {
    name: string
    sessionCount: number
  }
  purchaseDate: string
  expiryDate?: string
  totalSessions: number
  usedSessions: number
  remainingSessions: number
  status: string
}

export default function CustomersPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedCustomerPurchases, setSelectedCustomerPurchases] = useState<PackagePurchase[]>([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  const loadCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/dashboard/customers')
      if (!response.ok) {
        throw new Error('Failed to load customers')
      }
      const data = await response.json()
      // Ensure we always have an array
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers')
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
      .then(() => {
        // Load customers from API
        loadCustomers()
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])


  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        throw new Error('Failed to create customer')
      }
      
      setShowAddModal(false)
      setFormData({ name: '', email: '', phone: '' })
      await loadCustomers() // Reload customers after creation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowViewModal(true)
  }

  const handleViewSessions = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowSessionsModal(true)
    
    // Fetch package purchases for this customer
    try {
      const response = await fetch(`/api/packages/purchase?customerId=${customer.id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedCustomerPurchases(data.purchases || [])
      }
    } catch (err) {
      console.error('Failed to load package purchases:', err)
      setSelectedCustomerPurchases([])
    }
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone
    })
    setShowEditModal(true)
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCustomer) {
      try {
        setSaving(true)
        setError(null)
        
        const response = await fetch('/api/dashboard/customers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...formData, id: selectedCustomer.id }),
        })
        if (!response.ok) {
          throw new Error('Failed to update customer')
        }
        
        setShowEditModal(false)
        setSelectedCustomer(null)
        setFormData({ name: '', email: '', phone: '' })
        await loadCustomers() // Reload customers after update
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update customer')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm(t('deleteCustomerConfirm'))) {
      try {
        setSaving(true)
        setError(null)
        
        const response = await fetch(`/api/dashboard/customers?id=${customerId}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error('Failed to delete customer')
        }
        
        await loadCustomers() // Reload customers after deletion
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete customer')
      } finally {
        setSaving(false)
      }
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  )

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
            <h3 className="text-lg font-medium text-red-800">Error Loading Customers</h3>
            <p className="text-red-600 mt-2">{error}</p>
            <button 
              onClick={loadCustomers}
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
            <h1 className="text-3xl font-bold text-gray-900">{t('customers')}</h1>
            <p className="mt-2 text-sm text-gray-600">{t('customersSubtitle') || 'Manage your customer relationships and history'}</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {t('addCustomerBtn')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">{t('totalCustomers')}</div>
            <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
            <div className="text-xs text-gray-600">
              {customers.length === 0 
                ? t('noCustomers')
                : t('allTimeTotal')}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">{t('activeCustomers')}</div>
            <div className="text-2xl font-bold text-gray-900">
              {customers.filter(c => c.status === 'active').length}
            </div>
            <div className="text-xs text-gray-600">{t('regularVisitors')}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">{t('averageVisits')}</div>
            <div className="text-2xl font-bold text-gray-900">
              {customers.length > 0 
                ? (customers.reduce((sum, c) => sum + c.totalVisits, 0) / customers.length).toFixed(1)
                : '0'}
            </div>
            <div className="text-xs text-gray-600">{t('perCustomer')}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">{t('totalRevenue')}</div>
            <div className="text-2xl font-bold text-gray-900">
              ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">
              {customers.length === 0 
                ? t('noRevenueYet')
                : t('allTimeRevenue')}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder={t('searchCustomers')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Customers Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('contact')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('visits')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('totalSpent')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('lastVisit')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('activeSessions')}
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
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.totalVisits}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${customer.totalSpent}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.lastVisit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleViewSessions(customer)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      {t('viewSessions')}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.status === 'active' 
                        ? t('active')
                        : t('inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewCustomer(customer)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      {t('view')}
                    </button>
                    <button 
                      onClick={() => handleEditCustomer(customer)}
                      className="text-gray-600 hover:text-gray-900 mr-3"
                    >
                      {t('edit')}
                    </button>
                    <button 
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">{t('noCustomers')}</p>
          </div>
        )}

        {/* View Customer Modal */}
        {showViewModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{t('customer')} {t('view')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('name')}</label>
                  <p className="mt-1 text-gray-900">{selectedCustomer.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('email')}</label>
                  <p className="mt-1 text-gray-900">{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('phone')}</label>
                  <p className="mt-1 text-gray-900">{selectedCustomer.phone}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('totalVisits')}</label>
                    <p className="mt-1 text-gray-900">{selectedCustomer.totalVisits}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('totalSpent')}</label>
                    <p className="mt-1 text-gray-900">${selectedCustomer.totalSpent}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('lastVisit')}</label>
                  <p className="mt-1 text-gray-900">{selectedCustomer.lastVisit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('status')}</label>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedCustomer.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {t(selectedCustomer.status)}
                  </span>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      setSelectedCustomer(null)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('cancelBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{t('edit')} {t('customer')}</h2>
              <form className="space-y-4" onSubmit={handleUpdateCustomer}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('name')}</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('email')}</label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('phone')}</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedCustomer(null)
                      setFormData({ name: '', email: '', phone: '' })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('cancelBtn')}
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

        {/* Add Customer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
              <form className="space-y-4" onSubmit={handleAddCustomer}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setFormData({ name: '', email: '', phone: '' })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? t('adding') : t('addCustomer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sessions Modal */}
        {showSessionsModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {t('packageSessionsFor')}
                {selectedCustomer.name}
              </h2>
              
              {selectedCustomerPurchases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{t('noPurchasesFound') || 'No purchases found'}</div>
              ) : (
                <div className="space-y-4">
                  {selectedCustomerPurchases.map((purchase) => (
                    <div key={purchase.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{purchase.package.name}</h3>
                          <p className="text-sm text-gray-600">
                            {t('purchasedLabel')}
                            {new Date(purchase.purchaseDate).toLocaleDateString()}
                          </p>
                          {purchase.expiryDate && (
                            <p className="text-sm text-gray-600">
                              {t('expiresLabel')}
                              {new Date(purchase.expiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          purchase.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : purchase.status === 'EXPIRED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {purchase.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {purchase.totalSessions}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t('totalSessions')}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {purchase.usedSessions}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t('used')}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {purchase.remainingSessions}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t('remaining')}
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{
                              width: `${(purchase.usedSessions / purchase.totalSessions) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowSessionsModal(false)
                    setSelectedCustomer(null)
                    setSelectedCustomerPurchases([])
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
