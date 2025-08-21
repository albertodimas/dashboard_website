'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardNav from '@/components/DashboardNav'

interface User {
  id: string
  email: string
  name: string
  subdomain: string
  role: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    appointmentsToday: 0,
    newCustomers: 0,
    pendingCount: 0,
    avgRating: 0,
    totalReviews: 0
  })

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(async data => {
        setUser(data.user)
        
        // For now, always show welcome back
        setIsFirstVisit(false)
        
        // Load business name from database
        try {
          const businessRes = await fetch('/api/dashboard/business')
          if (businessRes.ok) {
            const businessData = await businessRes.json()
            if (businessData.name) {
              setBusinessName(businessData.name)
            }
          }
        } catch (error) {
          console.error('Error loading business name:', error)
        }
        
        setLoading(false)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  // Load recent appointments and stats
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load appointments
        const appointmentsRes = await fetch('/api/dashboard/appointments')
        if (appointmentsRes.ok) {
          const appointments = await appointmentsRes.json()
          const appointmentsList = Array.isArray(appointments) ? appointments : []
          
          // Get the 3 most recent appointments
          setRecentAppointments(appointmentsList.slice(0, 3))
          
          // Calculate stats
          const today = new Date().toISOString().split('T')[0]
          const todayAppointments = appointmentsList.filter((apt: any) => apt.date === today)
          const pendingAppointments = todayAppointments.filter((apt: any) => apt.status === 'pending')
          const totalRevenue = appointmentsList
            .filter((apt: any) => apt.status !== 'cancelled')
            .reduce((sum: number, apt: any) => sum + (apt.price || 0), 0)
          
          setStats(prev => ({
            ...prev,
            totalRevenue,
            appointmentsToday: todayAppointments.length,
            pendingCount: pendingAppointments.length
          }))
        }
        
        // Load customers count
        const customersRes = await fetch('/api/dashboard/customers')
        if (customersRes.ok) {
          const customers = await customersRes.json()
          const customersList = Array.isArray(customers) ? customers : []
          // Count new customers (created in last 7 days)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          const newCustomersCount = customersList.filter((c: any) => {
            // For now, count all as new since we don't have createdAt in the current structure
            return true
          }).length
          
          setStats(prev => ({
            ...prev,
            newCustomers: customersList.length
          }))
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      }
    }
    
    if (user) {
      loadDashboardData()
    }
  }, [user])

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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isFirstVisit ? `${t('welcome')}, ${user?.name}!` : `${t('welcomeBack')}, ${user?.name}!`}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isFirstVisit 
              ? t('letsGetStarted')
              : t('whatsHappening')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t('totalRevenue')}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </dd>
              <dd className="mt-2 text-sm text-green-600">
                {t('language') === 'en' ? 'Total this month' : 'Total este mes'}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t('appointmentsToday')}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.appointmentsToday}
              </dd>
              <dd className="mt-2 text-sm text-gray-600">
                {stats.pendingCount} {t('pendingConfirmation')}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t('newCustomers')}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.newCustomers}
              </dd>
              <dd className="mt-2 text-sm text-green-600">
                {t('language') === 'en' ? 'Total customers' : 'Total de clientes'}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t('avgRating')}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.avgRating.toFixed(1)}
              </dd>
              <dd className="mt-2 text-sm text-gray-600">
                {stats.totalReviews === 0 
                  ? (t('language') === 'en' ? 'No reviews yet' : 'Sin reseñas aún')
                  : `${t('language') === 'en' ? 'From' : 'De'} ${stats.totalReviews} ${t('language') === 'en' ? 'reviews' : 'reseñas'}`
                }
              </dd>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {t('recentAppointments')}
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {recentAppointments.length > 0 ? (
                <div className="space-y-4">
                  {recentAppointments.map((appointment, index) => {
                    const statusColors = {
                      confirmed: 'bg-green-100 text-green-800',
                      pending: 'bg-yellow-100 text-yellow-800',
                      cancelled: 'bg-red-100 text-red-800',
                      completed: 'bg-blue-100 text-blue-800'
                    }
                    return (
                      <div key={appointment.id} className={`flex items-center justify-between py-3 ${index < recentAppointments.length - 1 ? 'border-b' : ''}`}>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{appointment.customerName}</p>
                          <p className="text-sm text-gray-500">
                            {appointment.service} - {appointment.date} {t('at')} {appointment.time}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[appointment.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                          {t(appointment.status)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  {t('language') === 'en' ? 'No appointments scheduled yet.' : 'No hay citas programadas aún.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('quickActions')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Link href="/dashboard/appointments" className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm hover:bg-gray-50 block text-center">
              <div className="text-sm font-medium text-gray-900">{t('newAppointment')}</div>
            </Link>
            <Link href="/dashboard/services" className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm hover:bg-gray-50 block text-center">
              <div className="text-sm font-medium text-gray-900">{t('addService')}</div>
            </Link>
            <Link href="/dashboard/reports" className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm hover:bg-gray-50 block text-center">
              <div className="text-sm font-medium text-gray-900">{t('viewReports')}</div>
            </Link>
            <Link href="/dashboard/settings" className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm hover:bg-gray-50 block text-center">
              <div className="text-sm font-medium text-gray-900">{t('settings')}</div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}