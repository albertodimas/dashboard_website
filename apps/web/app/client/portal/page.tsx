'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Package, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  LogOut,
  CreditCard,
  Activity,
  ChevronRight
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function ClientPortal() {
  const router = useRouter()
  const { t } = useLanguage()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('packages')
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/client/packages')
      
      if (response.status === 401) {
        router.push('/client/login')
        return
      }

      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    document.cookie = 'customer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/client/login')
  }

  const getStatusBadge = (status: string, context: 'package' | 'appointment' = 'package') => {
    const normalized = (status || '').toUpperCase()

    switch (normalized) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('active')}
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('confirmed')}
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            {context === 'package' ? (t('paymentPending') || t('pending')) : t('pending')}
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            {t('cancelled')}
          </span>
        )
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            {t('expired')}
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('completed')}
          </span>
        )
      default:
        return null
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your portal...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // Group packages by package ID and business
  const groupedPackages = data.packages?.reduce((acc: any, purchase: any) => {
    const key = `${purchase.packageId}_${purchase.businessId}`
    if (!acc[key]) {
      acc[key] = {
        packageName: purchase.package.name,
        businessName: purchase.business.name,
        businessSlug: purchase.business.slug,
        businessPhone: purchase.business.phone,
        businessEmail: purchase.business.email,
        purchases: []
      }
    }
    acc[key].purchases.push(purchase)
    return acc
  }, {})

  const toggleExpanded = (packageKey: string) => {
    const newExpanded = new Set(expandedPackages)
    if (newExpanded.has(packageKey)) {
      newExpanded.delete(packageKey)
    } else {
      newExpanded.add(packageKey)
    }
    setExpandedPackages(newExpanded)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Customer Portal</h1>
                <p className="text-sm text-gray-600">Welcome, {data.customer?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Packages</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats?.activePackages || 0}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessions Available</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats?.totalSessionsAvailable || 0}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Packages</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats?.pendingPackages || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats?.upcomingAppointments || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('packages')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'packages'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Packages
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'appointments'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Appointment History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'packages' ? (
              <div className="space-y-4">
                {!groupedPackages || Object.keys(groupedPackages).length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No packages found</p>
                    <p className="text-sm text-gray-400 mt-2">Contact your service provider to purchase a package</p>
                  </div>
                ) : (
                  Object.entries(groupedPackages).map(([key, group]: [string, any]) => {
                    const activePurchases = group.purchases.filter((p: any) => p.status === 'ACTIVE')
                    const pendingPurchases = group.purchases.filter((p: any) => p.status === 'PENDING')
                    const totalActiveSessions = activePurchases.reduce((sum: number, p: any) => sum + p.remainingSessions, 0)
                    const totalUsedSessions = activePurchases.reduce((sum: number, p: any) => sum + p.usedSessions, 0)
                    const totalSessions = activePurchases.reduce((sum: number, p: any) => sum + p.totalSessions, 0)
                    const hasActivePurchases = activePurchases.length > 0
                    const isExpanded = expandedPackages.has(key)

                    return (
                      <div key={key} className="border rounded-lg p-6 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {group.packageName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              From {group.businessName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {pendingPurchases.length > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {pendingPurchases.length} Pending
                              </span>
                            )}
                            {hasActivePurchases && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Summary for active packages */}
                        {hasActivePurchases && (
                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Total Sessions Available</p>
                              <p className="text-2xl font-bold text-blue-600">{totalActiveSessions}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Usage</p>
                              <p className="font-medium">
                                {totalUsedSessions} / {totalSessions} used
                              </p>
                              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${totalSessions > 0 ? (totalUsedSessions / totalSessions) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Active Packages</p>
                              <p className="text-2xl font-bold text-gray-900">{activePurchases.length}</p>
                            </div>
                          </div>
                        )}

                        {/* Expand/Collapse button */}
                        {group.purchases.length > 1 && (
                          <button
                            onClick={() => toggleExpanded(key)}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronRight className="w-4 h-4 mr-1 rotate-90 transition-transform" />
                                Hide individual purchases
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-4 h-4 mr-1 transition-transform" />
                                Show {group.purchases.length} individual purchases
                              </>
                            )}
                          </button>
                        )}

                        {/* Individual purchases (expanded view or single purchase) */}
                        {(isExpanded || group.purchases.length === 1) && (
                          <div className="space-y-3 border-t pt-4">
                            {group.purchases.map((pkg: any) => (
                              <div key={pkg.id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="text-sm">
                                    <p className="font-medium text-gray-700">
                                      Purchase #{pkg.id.slice(-6).toUpperCase()}
                                    </p>
                                    <p className="text-gray-500">
                                      {formatDate(pkg.purchaseDate)}
                                    </p>
                                  </div>
                                  {getStatusBadge(pkg.status)}
                                </div>
                                
                                {pkg.status === 'ACTIVE' && (
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                      {pkg.remainingSessions} of {pkg.totalSessions} sessions remaining
                                    </span>
                                    {pkg.expiryDate && (
                                      <span className="text-gray-500">
                                        Expires: {formatDate(pkg.expiryDate)}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {pkg.status === 'PENDING' && (
                                  <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                                    Awaiting payment confirmation
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Pending payment warning */}
                        {pendingPurchases.length > 0 && !isExpanded && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                            <div className="flex">
                              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-yellow-800">
                                  {pendingPurchases.length} Purchase{pendingPurchases.length > 1 ? 's' : ''} {t('paymentPending') || 'Pending Payment'}
                                </p>
                                <p className="text-sm text-yellow-700 mt-1">
                                  Please complete your payment to activate. 
                                  Contact {group.businessName} at {group.businessPhone} or {group.businessEmail}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Book appointment button */}
                        {hasActivePurchases && totalActiveSessions > 0 && (
                          <div className="mt-4 flex justify-end">
                            <Link
                              href={`/business/${group.businessSlug}`}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                              Book Appointment ({totalActiveSessions} sessions available)
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {data.appointments?.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No appointments yet</p>
                  </div>
                ) : (
                  data.appointments?.map((apt: any) => (
                    <div key={apt.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{apt.service?.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {apt.business?.name}
                            {apt.staff && ` • with ${apt.staff.name}`}
                          </p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(apt.date)}
                            <Clock className="w-4 h-4 ml-3 mr-1" />
                            {apt.time}
                          </div>
                        </div>
                        {getStatusBadge(apt.status, 'appointment')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
