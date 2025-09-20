'use client'

import { logger } from '@/lib/logger'
import { useEffect, useState, useRef } from 'react'
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
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openCategories = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setCategoriesOpen(true)
  }

  const scheduleCloseCategories = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => setCategoriesOpen(false), 250)
  }
  
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
        logger.error('Error loading business name:', error)
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
    // Categories moved to dropdown below
    { href: '/dashboard/reports', label: t('reports') },
    { href: '/dashboard/settings', label: t('settings') },
  ]
  
  const isCategoriesActive = pathname?.startsWith('/dashboard/categories') || pathname?.startsWith('/dashboard/gallery-categories')
  
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
              {(() => {
                const galleryIdx = navItems.findIndex(n => n.href === '/dashboard/gallery')
                const before = galleryIdx >= 0 ? navItems.slice(0, galleryIdx + 1) : navItems
                const after = galleryIdx >= 0 ? navItems.slice(galleryIdx + 1) : []

                const renderLink = (item: typeof navItems[number]) => {
                  const isActive = pathname === item.href
                  const isHighlight = 'highlight' in item && (item as any).highlight
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
                }

                return (
                  <>
                    {before.map(renderLink)}
                    {/* Categories dropdown placed immediately after Gallery */}
                    <div 
                      className="relative inline-flex items-center"
                      onMouseEnter={openCategories}
                      onMouseLeave={scheduleCloseCategories}
                    >
                      <button
                        onClick={() => setCategoriesOpen(v => !v)}
                        className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                          isCategoriesActive ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        {t('categories')}
                        <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {categoriesOpen && (
                        <div
                          className="absolute top-full left-0 z-10 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                          onMouseEnter={openCategories}
                          onMouseLeave={scheduleCloseCategories}
                        >
                          <div className="py-1">
                            <Link
                              href="/dashboard/categories"
                              className={`block px-4 py-2 text-sm ${pathname === '/dashboard/categories' ? 'text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                              {t('services')}
                            </Link>
                            <Link
                              href="/dashboard/gallery-categories"
                              className={`block px-4 py-2 text-sm ${pathname === '/dashboard/gallery-categories' ? 'text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                              {t('gallery')}
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                    {after.map(renderLink)}
                  </>
                )
              })()}
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
        {/* Mobile nav (after header row) */}
        <div className="sm:hidden py-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2">
            {(() => {
              const galleryIdx = navItems.findIndex(n => n.href === '/dashboard/gallery')
              const before = galleryIdx >= 0 ? navItems.slice(0, galleryIdx + 1) : navItems
              const after = galleryIdx >= 0 ? navItems.slice(galleryIdx + 1) : []

              const renderMobileLink = (item: typeof navItems[number]) => {
                const isActive = pathname === item.href
                const isHighlight = 'highlight' in item && (item as any).highlight
                return (
                  <Link
                    key={`m-${item.href}`}
                    href={item.href}
                    className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium border ${
                      isActive
                        ? 'bg-indigo-50 text-gray-900 border-indigo-200'
                        : isHighlight
                        ? 'text-blue-600 border-blue-200 bg-blue-50'
                        : 'text-gray-600 border-gray-200 bg-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              }

              return (
                <>
                  {before.map(renderMobileLink)}
                  {/* Categories chip placed immediately after Gallery */}
                  <div className="relative">
                    <button
                      onClick={() => setCategoriesOpen(v => !v)}
                      className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium border ${
                        isCategoriesActive ? 'bg-indigo-50 text-gray-900 border-indigo-200' : 'text-gray-600 border-gray-200 bg-white'
                      }`}
                    >
                      {t('categories')}
                      <svg className="ml-1 inline h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {categoriesOpen && (
                      <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="py-1">
                          <Link
                            href="/dashboard/categories"
                            className={`block px-4 py-2 text-sm ${pathname === '/dashboard/categories' ? 'text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCategoriesOpen(false)}
                          >
                            {t('services')}
                          </Link>
                          <Link
                            href="/dashboard/gallery-categories"
                            className={`block px-4 py-2 text-sm ${pathname === '/dashboard/gallery-categories' ? 'text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCategoriesOpen(false)}
                          >
                            {t('gallery')}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                  {after.map(renderMobileLink)}
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </nav>
  )
}
