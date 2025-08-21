'use client'

import Link from 'next/link'

export default function ConfirmationErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Error de Confirmación</h1>
        <p className="text-gray-600 mb-6">
          Hubo un problema al confirmar tu cita. El enlace puede ser incorrecto o haber expirado.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Si continúas teniendo problemas, por favor contacta directamente al negocio.
        </p>
        <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}