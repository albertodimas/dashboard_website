'use client'

import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ConfirmPage() {
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed'>('loading')
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null)

  useEffect(() => {
    // Check if we have booking confirmation data (from booking page)
    const dataParam = searchParams.get('data')
    if (dataParam) {
      try {
        const bookingData = JSON.parse(decodeURIComponent(dataParam))
        setAppointmentDetails(bookingData)
        setStatus('success')
      } catch (error) {
        logger.error('Error parsing booking data:', error)
        setStatus('error')
      }
      return
    }
    
    // Otherwise check for appointment ID (from email confirmation)
    const appointmentId = searchParams.get('id')
    
    if (!appointmentId) {
      setStatus('error')
      return
    }

    // Confirm appointment via API
    fetch('/api/confirm-appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ appointmentId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAppointmentDetails(data.appointment)
          setStatus(data.alreadyConfirmed ? 'already_confirmed' : 'success')
        } else {
          setStatus('error')
        }
      })
      .catch(() => {
        setStatus('error')
      })
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('confirmingAppointment')}</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('confirmationFailed')}</h1>
            <p className="text-gray-600">{t('appointmentNotFound')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'already_confirmed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('alreadyConfirmed')}</h1>
            <p className="text-gray-600 mb-4">{t('appointmentAlreadyConfirmed')}</p>
            {appointmentDetails && (
              <div className="mt-6 text-left bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{t('date')}:</span> {
                    appointmentDetails.date 
                      ? appointmentDetails.date.includes('T') 
                        ? new Date(appointmentDetails.date).toLocaleDateString('en-GB')
                        : appointmentDetails.date
                      : ''
                  }
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{t('time')}:</span> {
                    appointmentDetails.time
                      ? appointmentDetails.time.includes('T')
                        ? new Date(appointmentDetails.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                        : appointmentDetails.time
                      : ''
                  }
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{t('service')}:</span> {appointmentDetails.serviceName || appointmentDetails.service}
                </p>
                {appointmentDetails.staffName && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Professional:</span> {appointmentDetails.staffName}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('appointmentConfirmed')}</h1>
          <p className="text-gray-600 mb-4">Thanks for your confirmation!</p>
          {appointmentDetails && (
            <div className="mt-6 text-left bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{t('date')}:</span> {
                  appointmentDetails.date 
                    ? appointmentDetails.date.includes('T') 
                      ? new Date(appointmentDetails.date).toLocaleDateString('en-GB')
                      : appointmentDetails.date
                    : ''
                }
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{t('time')}:</span> {
                  appointmentDetails.time
                    ? appointmentDetails.time.includes('T')
                      ? new Date(appointmentDetails.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                      : appointmentDetails.time
                    : ''
                }
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{t('service')}:</span> {appointmentDetails.serviceName || appointmentDetails.service}
              </p>
              {appointmentDetails.staffName && (
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Professional:</span> {appointmentDetails.staffName}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}