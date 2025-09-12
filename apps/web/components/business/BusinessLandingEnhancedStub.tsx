"use client"

import React from 'react'

interface BusinessLandingProps {
  business: any
}

export default function BusinessLandingEnhancedStub({ business }: BusinessLandingProps) {
  // Stub simple para evitar error de parseo mientras se depura la versión completa
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-6 rounded-lg bg-white shadow">
        <h1 className="text-xl font-semibold mb-2">{business?.name || 'Negocio'}</h1>
        <p className="text-gray-600">Vista del negocio temporalmente deshabilitada mientras resolvemos un error de compilación.</p>
      </div>
    </div>
  )
}

