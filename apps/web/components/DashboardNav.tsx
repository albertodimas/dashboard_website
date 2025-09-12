'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'

export default function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [businessName, setBusinessName] = useState('')
  const [enableStaffModule, setEnableStaffModule] = useState(false)
  const [enablePackagesModule, setEnablePackagesModule] = useState(false)
  const [isProjectMode, setIsProjectMode] = useState(false)
  
  useEffect(() => {
    // Load business name from database
    const loadBusinessName = async () => {
      try {
        const response = await fetch('/api/dashboard/business')
        if (response.ok) {
          const data = await response.json()
          if (data.name) {
            setBusinessName(data.name)
          }
          // Check for enableStaffModule explicitly
          setEnableStaffModule(data.enableStaffModule === true)
          // Check for enablePackagesModule
          setEnablePackagesModule(data.enablePackagesModule === true)
          // Operation mode (Reserva/Proyecto)
          const mode = (data.settings && data.settings.operationMode) || 'RESERVA'
          setIsProjectMode(mode === 'PROYECTO')
        }
      } catch (error) {
        console.error('Error loading business name:', error)
      }
    }
    loadBusinessName()
  }, [])
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }
  
  const navItems = [
    { href: '/dashboard/appointments', label: t('appointments') },
    { href: '/dashboard/services', label: t('services') },
    ...(isProjectMode ? [{ href: '/dashboard/project-requests', label: `🛠 ${t('projectRequestsNav') || 'Project Requests'}`, highlight: true }] : []),
    ...(enablePackagesModule ? [
      {
        href: '/dashboard/packages', 
        label: `📦 ${t('packagesNav') || t('packagesSection') || 'Packages'}`,
        highlight: true 
      },
      {
        href: '/dashboard/package-purchases', 
        label: `💳 ${t('purchasesNav') || t('allPurchases') || 'Purchases'}`,
        highlight: true
      }
    ] : []),
    ...(enableStaffModule ? [{ 
      href: '/dashboard/staff', 
      label: `👥 ${t('staffNav') || 'Staff'}`,
      highlight: true 
    }] : []),
    { href: '/dashboard/gallery', label: t('gallery') },
    { href: '/dashboard/customers', label: t('customers') },
    { href: '/dashboard/categories', label: t('categories') },
    { href: '/dashboard/reports', label: t('reports') },
    { href: '/dashboard/settings', label: t('settings') },
  ]
  
  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              {businessName ? (
                <>
                  <span className="text-xl font-bold text-gray-900">{businessName}</span>
                  <span className="mx-3 text-xl font-bold text-gray-900">|</span>
                  <Link href="/dashboard" className="text-xl font-semibold text-gray-700 ml-3">
                    {t('dashboard')}
                  </Link>
                </>
              ) : (
                <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                  {t('dashboard')}
                </Link>
              )}
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const isHighlight = 'highlight' in item && item.highlight
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : isHighlight
                        ? 'border-transparent text-blue-600 hover:border-blue-300 hover:text-blue-700'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
