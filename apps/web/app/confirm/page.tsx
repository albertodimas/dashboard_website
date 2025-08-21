'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ConfirmAppointmentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed'>('loading')
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null)
  
  useEffect(() => {
    // First check if we have data passed directly (new booking flow)
    const dataParam = searchParams.get('data')
    
    if (dataParam) {
      try {
        const appointmentData = JSON.parse(decodeURIComponent(dataParam))
        setAppointmentDetails(appointmentData)
        setStatus('success')
        return
      } catch (error) {
        console.error('Error parsing appointment data:', error)
        setStatus('error')
        return
      }
    }
    
    // Legacy flow: check for appointment ID
    const appointmentId = searchParams.get('id')
    
    if (!appointmentId) {
      setStatus('error')
      return
    }
    
    // Get appointments from localStorage (legacy)
    const savedAppointments = localStorage.getItem('appointments')
    if (!savedAppointments) {
      setStatus('error')
      return
    }
    
    const appointments = JSON.parse(savedAppointments)
    const appointment = appointments.find((apt: any) => apt.id === appointmentId)
    
    if (!appointment) {
      setStatus('error')
      return
    }
    
    // Check if already confirmed
    if (appointment.status === 'confirmed') {
      setStatus('already_confirmed')
      setAppointmentDetails(appointment)
      return
    }
    
    // Update appointment status to confirmed
    const updatedAppointments = appointments.map((apt: any) =>
      apt.id === appointmentId
        ? { ...apt, status: 'confirmed' }
        : apt
    )
    
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments))
    setAppointmentDetails({ ...appointment, status: 'confirmed' })
    setStatus('success')
  }, [searchParams])
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('confirmingAppointment')}</p>
        </div>
      </div>
    )
  }
  
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('confirmationError')}</h1>
          <p className="text-gray-600 mb-6">
            {t('appointmentNotFound')}
          </p>
          <Link href="/directory" className="text-blue-600 hover:text-blue-700 font-medium">
            {t('backToHome')}
          </Link>
        </div>
      </div>
    )
  }
  
  if (status === 'already_confirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('appointmentAlreadyConfirmed')}</h1>
            <p className="text-gray-600">
              {t('appointmentPreviouslyConfirmed')}
            </p>
          </div>
          
          {appointmentDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-gray-900 mb-3">{t('appointmentDetails')}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('service')}:</span>
                  <span className="font-medium">{appointmentDetails.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('date')}:</span>
                  <span className="font-medium">{appointmentDetails.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('time')}:</span>
                  <span className="font-medium">{appointmentDetails.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('status')}:</span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {t('confirmed')}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('backToHome')}
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('appointmentConfirmed')}</h1>
          <p className="text-gray-600">
            {t('appointmentConfirmedSuccess')}
          </p>
        </div>
        
        {appointmentDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">{t('appointmentDetails')}</h2>
            <div className="space-y-2 text-sm">
              {appointmentDetails.businessName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('businessName')}:</span>
                  <span className="font-medium">{appointmentDetails.businessName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">{t('service')}:</span>
                <span className="font-medium">{appointmentDetails.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('date')}:</span>
                <span className="font-medium">{appointmentDetails.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('time')}:</span>
                <span className="font-medium">{appointmentDetails.time}</span>
              </div>
              {appointmentDetails.price && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('price')}:</span>
                  <span className="font-medium">${appointmentDetails.price}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">{t('status')}:</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {t('confirmed')}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">{t('reminder')}:</p>
              <p>{t('saveCalendarReminder')}</p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Link href="/directory" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}