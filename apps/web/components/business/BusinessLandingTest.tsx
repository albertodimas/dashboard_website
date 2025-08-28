'use client'

interface BusinessLandingProps {
  business: any
}

export default function BusinessLandingTest({ business }: BusinessLandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <h1>Business Landing Test</h1>
      <p>Business: {business?.name}</p>
    </div>
  )
}