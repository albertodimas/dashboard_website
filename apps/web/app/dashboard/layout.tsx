'use client'

import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'
import SupportButton from '@/components/dashboard/SupportButton'

interface User {
  email: string
  name: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    // Load user data
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('Not authenticated')
      })
      .then(data => {
        setUser(data.user)
      })
      .catch(err => {
        logger.error('Error loading user:', err)
      })

    // Load business name
    fetch('/api/dashboard/business')
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('No business data')
      })
      .then(data => {
        if (data.name) {
          setBusinessName(data.name)
        }
      })
      .catch(err => {
        logger.error('Error loading business:', err)
      })
  }, [])

  return (
    <>
      {children}
      <SupportButton 
        businessName={businessName} 
        userEmail={user?.email}
      />
    </>
  )
}