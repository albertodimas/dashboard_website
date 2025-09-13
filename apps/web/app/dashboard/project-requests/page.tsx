'use client'

import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import DashboardNav from '@/components/DashboardNav'

interface RequestItem {
  id: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  serviceType: string
  description: string
  address?: string
  preferredContact: string
  status: string
  createdAt: string
}

export default function ProjectRequestsPage() {
  const toast = useToast()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const q = statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''
      const res = await fetch(`/api/dashboard/project-requests${q}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error loading requests')
      setRequests(data.requests || [])
    } catch (e: any) {
      setError(e?.message || 'Error loading requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  const changeStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/dashboard/project-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch (e: any) {
      toast(e?.message || 'Error updating status', 'error')
    }
  }

  const filtered = useMemo(() => requests, [requests])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Proyecto</h1>
            <p className="text-sm text-gray-600">Gestiona y da seguimiento a las solicitudes recibidas.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="ALL">Todas</option>
              <option value="NEW">Nuevas</option>
              <option value="CONTACTED">Contactadas</option>
              <option value="SCHEDULED">Programadas</option>
              <option value="CLOSED">Cerradas</option>
            </select>
            <button onClick={load} className="px-3 py-2 border rounded-md bg-white">Refrescar</button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>
        )}

        {loading ? (
          <div> Cargando... </div>
        ) : (
          <div className="bg-white border rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{r.customerName}</div>
                      <div className="text-gray-500">{r.customerEmail}{r.customerPhone ? ` • ${r.customerPhone}` : ''}</div>
                      {r.address && <div className="text-gray-500">📍 {r.address}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-medium">{r.serviceType}</div>
                      <div className="text-gray-500 mt-1 max-w-xs whitespace-pre-wrap">{r.description}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.preferredContact}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                        r.status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-700' :
                        r.status === 'SCHEDULED' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {r.status !== 'CONTACTED' && (
                          <button onClick={() => changeStatus(r.id, 'CONTACTED')} className="px-2 py-1 border rounded">Marcar contactada</button>
                        )}
                        {r.status !== 'SCHEDULED' && (
                          <button onClick={() => changeStatus(r.id, 'SCHEDULED')} className="px-2 py-1 border rounded">Programada</button>
                        )}
                        {r.status !== 'CLOSED' && (
                          <button onClick={() => changeStatus(r.id, 'CLOSED')} className="px-2 py-1 border rounded">Cerrar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={6}>No hay solicitudes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
