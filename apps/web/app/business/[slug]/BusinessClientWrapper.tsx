'use client'

import { useEffect, useState } from 'react'
import BusinessLandingEnhanced from '@/components/business/BusinessLandingEnhanced'

export default function BusinessClientWrapper({ businessId, initialData }: any) {
  const [businessData, setBusinessData] = useState(initialData)

  useEffect(() => {
    // Fetch complete data on client side
    fetchBusinessData()
  }, [])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/public/business/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusinessData(data)
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    }
  }

  if (!businessData) {
    return <div>Loading...</div>
  }

  return <BusinessLandingEnhanced business={businessData} />
}
