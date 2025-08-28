'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BusinessLandingProps {
  business: any
}

export default function BusinessLandingMinimal({ business }: BusinessLandingProps) {
  const theme = business.settings?.theme || {}
  const colors = {
    primary: theme.primaryColor || '#3B82F6',
    secondary: theme.secondaryColor || '#1F2937',
    accent: theme.accentColor || '#10B981',
    background: theme.backgroundColor || '#FFFFFF'
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reservationData, setReservationData] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'TRANSFER',
    notes: ''
  })
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [showPackageReserveModal, setShowPackageReserveModal] = useState(false)
  const [reservationSuccess, setReservationSuccess] = useState(false)
  
  const handlePackageReserve = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/public/packages/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage?.id,
          customerName: reservationData.name,
          customerEmail: reservationData.email,
          customerPhone: reservationData.phone,
          paymentMethod: reservationData.paymentMethod,
          notes: reservationData.notes
        })
      })

      if (response.ok) {
        const result = await response.json()
        setReservationSuccess(true)
        alert(`Package reserved successfully! ${result.purchase.paymentInstructions.message}`)
        setReservationData({
          name: '',
          email: '',
          phone: '',
          paymentMethod: 'TRANSFER',
          notes: ''
        })
        setShowPackageReserveModal(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to reserve package')
      }
    } catch (error) {
      console.error('Reservation error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="fixed top-0 w-full backdrop-blur-md bg-white/80 border-b border-gray-100 z-50">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/business/${business.slug}`} className="text-3xl font-black tracking-tight" style={{ color: colors.primary }}>
              {business.name}
            </Link>
          </div>
        </nav>
      </header>
      <main className="pt-20">
        <h1>Business Page</h1>
      </main>
    </div>
  )
}