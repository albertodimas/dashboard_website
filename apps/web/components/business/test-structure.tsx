'use client'

import { useState, useEffect } from 'react'

interface BusinessLandingProps {
  business: any
}

export default function BusinessLanding({ business }: BusinessLandingProps) {
  const [test, setTest] = useState(false)
  
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handlePackageReserve = async (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="fixed top-0 w-full backdrop-blur-md bg-white/80 border-b border-gray-100 z-50">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            Test
          </div>
        </nav>
      </header>
    </div>
  )
}