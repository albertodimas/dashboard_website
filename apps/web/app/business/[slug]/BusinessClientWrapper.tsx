'use client'

import { logger } from '@/lib/logger'
import { useCallback, useEffect, useState } from 'react'
import BusinessLandingEnhanced from '@/components/business/BusinessLandingEnhanced'

export default function BusinessClientWrapper({ businessId, initialData }: any) {
  const [businessData, setBusinessData] = useState(initialData)

  const fetchBusinessData = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/business/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusinessData(data)
      }
    } catch (error) {
      logger.error('Error fetching business data:', error)
    }
  }, [businessId])

  useEffect(() => {
    void fetchBusinessData()
  }, [fetchBusinessData])

  if (!businessData) {
    return <div>Loading...</div>
  }

  return <BusinessLandingEnhanced business={businessData} />
}
