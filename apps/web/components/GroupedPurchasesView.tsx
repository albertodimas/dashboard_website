'use client'

import { useState } from 'react'
import { ChevronRight, Package, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface GroupedPurchasesViewProps {
  groupedByCustomer: any
  language: string
  onActivatePurchase: (purchase: any) => void
  onDeletePurchase: (purchase: any) => void
}

export default function GroupedPurchasesView({ 
  groupedByCustomer, 
  language, 
  onActivatePurchase,
  onDeletePurchase 
}: GroupedPurchasesViewProps) {
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())

  const toggleExpanded = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers)
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId)
    } else {
      newExpanded.add(customerId)
    }
    setExpandedCustomers(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        )
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        )
      default:
        return null
    }
  }

  if (Object.keys(groupedByCustomer).length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">
          {language === 'en' ? 'No purchases found' : 'No se encontraron compras'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedByCustomer).map(([customerId, group]: [string, any]) => {
        const isExpanded = expandedCustomers.has(customerId)
        const totalActive = group.purchases.filter((p: any) => p.status === 'ACTIVE').length
        const totalPending = group.purchases.filter((p: any) => p.status === 'PENDING').length
        const totalRevenue = group.purchases
          .filter((p: any) => p.status === 'ACTIVE' || p.status === 'COMPLETED')
          .reduce((sum: number, p: any) => sum + p.pricePaid, 0)
        const totalSessions = group.purchases
          .filter((p: any) => p.status === 'ACTIVE')
          .reduce((sum: number, p: any) => sum + p.remainingSessions, 0)

        return (
          <div key={customerId} className="bg-white shadow rounded-lg overflow-hidden">
            {/* Customer Header */}
            <div 
              className="px-6 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
              onClick={() => toggleExpanded(customerId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChevronRight 
                    className={`w-5 h-5 text-gray-500 mr-3 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.customer?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {group.customer?.email} {group.customer?.phone && `• ${group.customer.phone}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {language === 'en' ? 'Total Purchases' : 'Compras Totales'}
                    </p>
                    <p className="text-lg font-bold text-gray-900">{group.purchases.length}</p>
                  </div>
                  {totalPending > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-yellow-600">
                        {language === 'en' ? 'Pending' : 'Pendientes'}
                      </p>
                      <p className="text-lg font-bold text-yellow-700">{totalPending}</p>
                    </div>
                  )}
                  {totalActive > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-green-600">
                        {language === 'en' ? 'Active' : 'Activos'}
                      </p>
                      <p className="text-lg font-bold text-green-700">{totalActive}</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-sm text-blue-600">
                      {language === 'en' ? 'Sessions' : 'Sesiones'}
                    </p>
                    <p className="text-lg font-bold text-blue-700">{totalSessions}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-600">
                      {language === 'en' ? 'Revenue' : 'Ingresos'}
                    </p>
                    <p className="text-lg font-bold text-purple-700">${totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Purchases List */}
            {isExpanded && (
              <div className="border-t">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                    {group.purchases.map((purchase: any) => (
                      <tr key={purchase.id} className="hover:bg-gray-50">
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
                                <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div 
                                    className="bg-blue-600 h-1.5 rounded-full"
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
                          {getStatusBadge(purchase.status)}
                          {purchase.paymentStatus === 'PENDING' && (
                            <div className="text-xs text-orange-600 mt-1">Payment Pending</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(purchase.purchaseDate).toLocaleDateString()}
                          {purchase.expiryDate && (
                            <div className="text-xs text-gray-400">
                              Exp: {new Date(purchase.expiryDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {purchase.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => onActivatePurchase(purchase)}
                                className="text-green-600 hover:text-green-900 mr-2"
                              >
                                {language === 'en' ? 'Activate' : 'Activar'}
                              </button>
                              <button
                                onClick={() => onDeletePurchase(purchase)}
                                className="text-red-600 hover:text-red-900"
                              >
                                {language === 'en' ? 'Delete' : 'Eliminar'}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}