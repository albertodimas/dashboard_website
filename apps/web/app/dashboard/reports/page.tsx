'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'
import DatePicker from '@/components/DatePicker'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { format } from 'date-fns'

interface Metrics {
  revenue: {
    total: number
    previous: number
    change: number
  }
  appointments: {
    total: number
    completed: number
    cancelled: number
    pending: number
    previous: number
    change: number
  }
  customers: {
    unique: number
    new: number
    returning: number
    previous: number
    change: number
  }
  averageTicket: number
}

interface ChartData {
  date: string
  revenue: number
  appointments: number
}

interface ServiceStat {
  name: string
  count: number
  revenue: number
}

interface StaffReport {
  id: string
  name: string
  photo: string
  metrics: {
    revenue: number
    previousRevenue: number
    revenueChange: number
    appointments: number
    completedAppointments: number
    cancelledAppointments: number
    hoursWorked: number
    averageTicket: number
    services: ServiceStat[]
  }
}

export default function ReportsPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [serviceStats, setServiceStats] = useState<ServiceStat[]>([])
  const [peakHours, setPeakHours] = useState<number[]>([])
  const [customDateRange, setCustomDateRange] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [staffReports, setStaffReports] = useState<StaffReport[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)

  const loadReports = async () => {
    try {
      setLoading(true)
      let url = `/api/dashboard/reports?period=${period}`
      
      if (customDateRange && startDate && endDate) {
        url = `/api/dashboard/reports?startDate=${startDate}&endDate=${endDate}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to load reports')
      }
      
      const data = await response.json()
      setMetrics(data.metrics)
      setChartData(data.chartData)
      setServiceStats(data.serviceStats)
      setPeakHours(data.peakHours || [])
      setStaffReports(data.staffReports || [])
    } catch (error) {
      console.error('Error loading reports:', error)
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
        loadReports()
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router, period, customDateRange, startDate, endDate])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  const customerData = metrics ? [
    { name: language === 'en' ? 'New' : 'Nuevos', value: metrics.customers.new },
    { name: language === 'en' ? 'Returning' : 'Recurrentes', value: metrics.customers.returning }
  ] : []

  const appointmentStatusData = metrics ? [
    { name: language === 'en' ? 'Completed' : 'Completadas', value: metrics.appointments.completed },
    { name: language === 'en' ? 'Pending' : 'Pendientes', value: metrics.appointments.pending },
    { name: language === 'en' ? 'Cancelled' : 'Canceladas', value: metrics.appointments.cancelled }
  ] : []

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'en' ? 'Business Reports' : 'Reportes del Negocio'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {language === 'en' 
              ? 'Track your business performance and growth' 
              : 'Rastrea el rendimiento y crecimiento de tu negocio'}
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => { setPeriod('daily'); setCustomDateRange(false) }}
              className={`px-4 py-2 rounded-lg ${period === 'daily' && !customDateRange ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {language === 'en' ? 'Daily' : 'Diario'}
            </button>
            <button
              onClick={() => { setPeriod('weekly'); setCustomDateRange(false) }}
              className={`px-4 py-2 rounded-lg ${period === 'weekly' && !customDateRange ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {language === 'en' ? 'Weekly' : 'Semanal'}
            </button>
            <button
              onClick={() => { setPeriod('monthly'); setCustomDateRange(false) }}
              className={`px-4 py-2 rounded-lg ${period === 'monthly' && !customDateRange ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {language === 'en' ? 'Monthly' : 'Mensual'}
            </button>
            <button
              onClick={() => { setPeriod('yearly'); setCustomDateRange(false) }}
              className={`px-4 py-2 rounded-lg ${period === 'yearly' && !customDateRange ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {language === 'en' ? 'Yearly' : 'Anual'}
            </button>
            
            <div className="ml-auto flex gap-2 items-center">
              <button
                onClick={() => setCustomDateRange(!customDateRange)}
                className={`px-4 py-2 rounded-lg ${customDateRange ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {language === 'en' ? 'Custom Range' : 'Rango Personalizado'}
              </button>
              
              {customDateRange && (
                <>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    className="px-3 py-2 border rounded-lg"
                    placeholder={language === 'en' ? 'Start date' : 'Fecha inicio'}
                  />
                  <span className="text-gray-500">-</span>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    className="px-3 py-2 border rounded-lg"
                    placeholder={language === 'en' ? 'End date' : 'Fecha fin'}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Total Revenue' : 'Ingresos Totales'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics ? formatCurrency(metrics.revenue.total) : '$0'}
                </p>
                {metrics && (
                  <p className={`text-sm mt-2 ${metrics.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(metrics.revenue.change)} 
                    <span className="text-gray-500 ml-1">
                      {language === 'en' ? 'vs previous' : 'vs anterior'}
                    </span>
                  </p>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Appointments Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Total Appointments' : 'Citas Totales'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.appointments.total || 0}
                </p>
                {metrics && (
                  <p className={`text-sm mt-2 ${metrics.appointments.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(metrics.appointments.change)}
                    <span className="text-gray-500 ml-1">
                      {language === 'en' ? 'vs previous' : 'vs anterior'}
                    </span>
                  </p>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Unique Customers' : 'Clientes Únicos'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.customers.unique || 0}
                </p>
                {metrics && (
                  <p className={`text-sm mt-2 ${metrics.customers.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(metrics.customers.change)}
                    <span className="text-gray-500 ml-1">
                      {language === 'en' ? 'vs previous' : 'vs anterior'}
                    </span>
                  </p>
                )}
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Ticket Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Average Ticket' : 'Ticket Promedio'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics ? formatCurrency(metrics.averageTicket) : '$0'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {language === 'en' ? 'Per appointment' : 'Por cita'}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Reports Section */}
        {staffReports && staffReports.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Professional Reports' : 'Reportes por Profesional'}
            </h2>
            
            {/* Staff Selector Tabs */}
            <div className="bg-white rounded-lg shadow mb-4">
              <div className="p-4 border-b">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedStaffId(null)}
                    className={`px-4 py-2 rounded-lg ${!selectedStaffId ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {language === 'en' ? 'All Professionals' : 'Todos los Profesionales'}
                  </button>
                  {staffReports.map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => setSelectedStaffId(staff.id)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${selectedStaffId === staff.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {staff.photo && (
                        <img 
                          src={staff.photo.startsWith('data:') ? staff.photo : `/api/images/${staff.photo}`}
                          alt={staff.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      )}
                      {staff.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Staff Report Cards */}
            {selectedStaffId === null ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffReports.map((staff) => (
                  <div key={staff.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                      {staff.photo && (
                        <img 
                          src={staff.photo.startsWith('data:') ? staff.photo : `/api/images/${staff.photo}`}
                          alt={staff.name}
                          className="w-12 h-12 rounded-full object-cover mr-3"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{staff.name}</h3>
                        <p className="text-sm text-gray-500">
                          {staff.metrics.hoursWorked} {language === 'en' ? 'hours worked' : 'horas trabajadas'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">{language === 'en' ? 'Revenue' : 'Ingresos'}</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(staff.metrics.revenue)}</p>
                        <p className={`text-sm ${staff.metrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(staff.metrics.revenueChange)} vs {language === 'en' ? 'previous' : 'anterior'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">{language === 'en' ? 'Appointments' : 'Citas'}</p>
                          <p className="font-semibold">{staff.metrics.appointments}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">{language === 'en' ? 'Avg Ticket' : 'Ticket Promedio'}</p>
                          <p className="font-semibold">{formatCurrency(staff.metrics.averageTicket)}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-600 mb-1">{language === 'en' ? 'Top Services' : 'Servicios Top'}</p>
                        {staff.metrics.services.slice(0, 3).map((service, idx) => (
                          <div key={idx} className="text-xs flex justify-between">
                            <span className="text-gray-700 truncate">{service.name}</span>
                            <span className="text-gray-900 font-medium">{formatCurrency(service.revenue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Detailed view for selected staff
              <div className="bg-white rounded-lg shadow p-6">
                {(() => {
                  const staff = staffReports.find(s => s.id === selectedStaffId)
                  if (!staff) return null
                  
                  return (
                    <div>
                      <div className="flex items-center mb-6">
                        {staff.photo && (
                          <img 
                            src={staff.photo.startsWith('data:') ? staff.photo : `/api/images/${staff.photo}`}
                            alt={staff.name}
                            className="w-16 h-16 rounded-full object-cover mr-4"
                          />
                        )}
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{staff.name}</h3>
                          <p className="text-gray-500">
                            {language === 'en' ? 'Professional Report' : 'Reporte del Profesional'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-blue-600">{language === 'en' ? 'Total Revenue' : 'Ingresos Totales'}</p>
                          <p className="text-2xl font-bold text-blue-900">{formatCurrency(staff.metrics.revenue)}</p>
                          <p className={`text-sm mt-1 ${staff.metrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(staff.metrics.revenueChange)}
                          </p>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-green-600">{language === 'en' ? 'Hours Worked' : 'Horas Trabajadas'}</p>
                          <p className="text-2xl font-bold text-green-900">{staff.metrics.hoursWorked}</p>
                          <p className="text-sm text-green-600 mt-1">
                            {language === 'en' ? 'hours' : 'horas'}
                          </p>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-sm text-purple-600">{language === 'en' ? 'Total Appointments' : 'Citas Totales'}</p>
                          <p className="text-2xl font-bold text-purple-900">{staff.metrics.appointments}</p>
                          <p className="text-sm text-purple-600 mt-1">
                            {staff.metrics.completedAppointments} {language === 'en' ? 'completed' : 'completadas'}
                          </p>
                        </div>
                        
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <p className="text-sm text-yellow-600">{language === 'en' ? 'Average Ticket' : 'Ticket Promedio'}</p>
                          <p className="text-2xl font-bold text-yellow-900">{formatCurrency(staff.metrics.averageTicket)}</p>
                          <p className="text-sm text-yellow-600 mt-1">
                            {language === 'en' ? 'per appointment' : 'por cita'}
                          </p>
                        </div>
                      </div>

                      {/* Service Breakdown */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          {language === 'en' ? 'Service Performance' : 'Rendimiento por Servicio'}
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Service' : 'Servicio'}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Count' : 'Cantidad'}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Revenue' : 'Ingresos'}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === 'en' ? 'Avg Price' : 'Precio Promedio'}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {staff.metrics.services.map((service, idx) => (
                                <tr key={idx}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {service.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {service.count}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {formatCurrency(service.revenue)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatCurrency(service.revenue / service.count)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {/* Revenue & Appointments Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Revenue Trend' : 'Tendencia de Ingresos'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#93C5FD" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Appointments Trend' : 'Tendencia de Citas'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="appointments" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Performance & Customer Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Top Services by Revenue' : 'Servicios Top por Ingresos'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceStats.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="revenue" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Customer Types' : 'Tipos de Clientes'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Appointment Status' : 'Estado de Citas'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {appointmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Hours */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Peak Business Hours' : 'Horas Pico del Negocio'}
            </h3>
            <div className="space-y-4">
              {peakHours.length > 0 ? (
                peakHours.map((hour, index) => (
                  <div key={hour} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold
                        ${index === 0 ? 'bg-gold-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}
                        style={{ backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }}
                      >
                        {index + 1}
                      </span>
                      <span className="ml-3 text-gray-900 font-medium">
                        {hour}:00 - {hour + 1}:00
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {language === 'en' ? 'Most bookings' : 'Más reservas'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  {language === 'en' ? 'No data available' : 'No hay datos disponibles'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'en' ? 'Export Reports' : 'Exportar Reportes'}
          </h3>
          <div className="flex gap-4">
            <button 
              onClick={async () => {
                try {
                  let url = `/api/dashboard/reports/export?format=excel&period=${period}`
                  if (customDateRange && startDate && endDate) {
                    url = `/api/dashboard/reports/export?format=excel&startDate=${startDate}&endDate=${endDate}`
                  }
                  
                  const response = await fetch(url)
                  if (!response.ok) throw new Error('Export failed')
                  
                  const blob = await response.blob()
                  const downloadUrl = window.URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = downloadUrl
                  link.download = `report_${new Date().toISOString().split('T')[0]}.xlsx`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  window.URL.revokeObjectURL(downloadUrl)
                } catch (error) {
                  console.error('Export error:', error)
                  alert(language === 'en' ? 'Failed to export report' : 'Error al exportar el reporte')
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {language === 'en' ? 'Export as Excel' : 'Exportar como Excel'}
            </button>
            <button 
              onClick={async () => {
                try {
                  let url = `/api/dashboard/reports/export?format=csv&period=${period}`
                  if (customDateRange && startDate && endDate) {
                    url = `/api/dashboard/reports/export?format=csv&startDate=${startDate}&endDate=${endDate}`
                  }
                  
                  const response = await fetch(url)
                  if (!response.ok) throw new Error('Export failed')
                  
                  const blob = await response.blob()
                  const downloadUrl = window.URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = downloadUrl
                  link.download = `report_${new Date().toISOString().split('T')[0]}.csv`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  window.URL.revokeObjectURL(downloadUrl)
                } catch (error) {
                  console.error('Export error:', error)
                  alert(language === 'en' ? 'Failed to export report' : 'Error al exportar el reporte')
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {language === 'en' ? 'Export as CSV' : 'Exportar como CSV'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}