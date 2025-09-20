'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { useLanguage } from '@/contexts/LanguageContext'
import { getImageUrl, getImageSrcSet } from '@/lib/upload-utils-client'
import { compressImage, formatFileSize } from '@/lib/image-resize-client'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'

interface Staff {
  id: string
  name: string
  email: string
  phone?: string
  photo?: string
  bio?: string
  specialties: string[]
  isActive: boolean
  canAcceptBookings: boolean
  displayOrder: number
  rating?: number
  totalReviews?: number
  _count?: {
    appointments: number
    staffReviews: number
  }
  workingHours?: WorkingHour[]
}

interface WorkingHour {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

interface Business {
  enableStaffModule: boolean
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', labelEs: 'Domingo' },
  { value: 1, label: 'Monday', labelEs: 'Lunes' },
  { value: 2, label: 'Tuesday', labelEs: 'Martes' },
  { value: 3, label: 'Wednesday', labelEs: 'Miércoles' },
  { value: 4, label: 'Thursday', labelEs: 'Jueves' },
  { value: 5, label: 'Friday', labelEs: 'Viernes' },
  { value: 6, label: 'Saturday', labelEs: 'Sábado' }
]

export default function StaffPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<Staff[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    photo: '',
    bio: '',
    specialties: [] as string[],
    isActive: true,
    canAcceptBookings: true
  })
  
  // Upload states
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const confirm = useConfirm()
  const toast = useToast()
  
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [scheduleData, setScheduleData] = useState<any>(() => {
    const initialSchedule: any = {}
    for (let day = 0; day <= 6; day++) {
      initialSchedule[day] = {
        isActive: day >= 1 && day <= 5, // Lunes a Viernes activos por defecto
        startTime: '09:00',
        endTime: '17:00'
      }
    }
    return initialSchedule
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        router.push('/login')
        return
      }

      // Load business info
      const businessRes = await fetch('/api/dashboard/business')
      if (businessRes.ok) {
        const businessData = await businessRes.json()
        setBusiness(businessData)
        
        // Only load staff if module is enabled
        if (businessData.enableStaffModule) {
          await loadStaff()
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStaff = async () => {
    try {
      const response = await fetch('/api/dashboard/staff')
      if (response.ok) {
        const data = await response.json()
        console.log('Staff data loaded:', data)
        setStaff(data)
      } else {
        console.error('Staff API response not OK:', response.status)
      }
    } catch (error) {
      console.error('Error loading staff:', error)
    }
  }

  const handleAddSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialtyInput.trim()]
      })
      setSpecialtyInput('')
    }
  }

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    })
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = event.target.files?.[0]
    if (!originalFile) return

    // Validar tipo de archivo
    if (!originalFile.type.startsWith('image/')) {
      toast(t('pleaseSelectImageFile') || 'Please select an image file', 'info')
      return
    }

    setUploadingPhoto(true)
    
    try {
      // Mostrar tamaño original
      const originalSize = formatFileSize(originalFile.size)
      setUploadProgress(t('processingImageWithSize') || `Processing image (${originalSize})...`)

      // Comprimir imagen automáticamente si es necesaria
      let fileToUpload = originalFile
      
      // Si la imagen es mayor a 5MB, comprimirla
      if (originalFile.size > 5 * 1024 * 1024) {
        setUploadProgress(t('compressingImage') || 'Compressing image...')
        
        fileToUpload = await compressImage(originalFile, 5) // Comprimir a máximo 5MB
        
        const newSize = formatFileSize(fileToUpload.size)
        setUploadProgress((t('imageCompressedFromTo') || 'Image compressed from {a} to {b}').replace('{a}', originalSize).replace('{b}', newSize))
      }

      // Crear preview local inmediatamente antes de comprimir
      const previewReader = new FileReader()
      previewReader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      previewReader.readAsDataURL(originalFile) // Usar archivo original para preview inmediato

      // Preparar FormData
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('type', 'avatar')
      if (selectedStaff?.id) {
        formData.append('id', `staff_${selectedStaff.id}`)
      }

      setUploadProgress(t('uploadingImage') || 'Uploading image...')

      // Subir imagen
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      
      // Actualizar formData con el ID de la imagen
      setFormData(prev => ({ ...prev, photo: data.imageId }))
      
      // Actualizar preview con la URL del servidor
      setPhotoPreview(data.url)
      
      setUploadProgress(t('imageUploadedSuccessfully') || 'Image uploaded successfully!')
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setUploadProgress(''), 3000)
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast(t('failedToUploadImage') || 'Failed to upload image', 'error')
      setUploadProgress('')
    } finally {
      setUploadingPhoto(false)
      // Resetear el input para permitir subir la misma imagen de nuevo si es necesario
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSaveStaff = async () => {
    try {
      setSaving(true)
      
      const method = selectedStaff ? 'PUT' : 'POST'
      const body = selectedStaff 
        ? { id: selectedStaff.id, ...formData }
        : formData

      const response = await fetch('/api/dashboard/staff', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error('Failed to save staff member')
      }

      await loadStaff()
      setShowAddModal(false)
      setSelectedStaff(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        photo: '',
        bio: '',
        specialties: [],
        isActive: true,
        canAcceptBookings: true
      })
      setPhotoPreview(null)
      setUploadProgress('')
    } catch (error) {
      console.error('Error saving staff:', error)
      toast(t('failedToSaveStaffMember') || 'Failed to save staff member', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    const ok = await confirm({
      title: t('delete') || 'Delete',
      message: t('deleteStaffConfirm') || 'Are you sure you want to delete this staff member?',
      confirmText: t('delete') || 'Delete',
      variant: 'danger'
    })
    if (!ok) return

    try {
      const response = await fetch(`/api/dashboard/staff?id=${staffId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete')
      }

      await loadStaff()
      toast(t('deleted') || 'Deleted', 'success')
    } catch (error: any) {
      toast(error.message || (t('failedToDelete') || 'Failed to delete'), 'error')
    }
  }

  const handleSaveSchedule = async () => {
    if (!selectedStaff) return

    try {
      setSaving(true)
      
      console.log('Saving schedule data:', scheduleData)
      
      const response = await fetch(`/api/dashboard/staff/${selectedStaff.id}/working-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to save schedule')
      }

      await loadStaff()
      toast(t('scheduleSaved') || 'Schedule saved successfully', 'success')
      // Cerrar el modal después de guardar exitosamente
      setShowScheduleModal(false)
      setSelectedStaff(null)
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast(t('failedToSaveSchedule') || 'Failed to save schedule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (member: Staff) => {
    setSelectedStaff(member)
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      photo: member.photo || '',
      bio: member.bio || '',
      specialties: member.specialties || [],
      isActive: member.isActive,
      canAcceptBookings: member.canAcceptBookings
    })
    // Si la foto existe, generar preview
    if (member.photo) {
      setPhotoPreview(getImageUrl(member.photo, 'avatar', 128))
    } else {
      setPhotoPreview(null)
      setUploadProgress('')
    }
    setUploadProgress('') // Limpiar progreso
    setShowAddModal(true)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">{t('loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!business?.enableStaffModule) {
    return (
      <DashboardLayout>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">{t('staffModuleNotEnabled') || 'Staff Module Not Enabled'}</h2>
          <p className="text-yellow-700">{t('staffModuleNotEnabledDesc') || 'The staff management module is not enabled for your business. Please contact the administrator to enable this feature.'}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('staffManagement') || 'Staff Management'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('staffManagementSubtitle') || 'Manage your staff members, schedules, and availability'}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedStaff(null)
              setFormData({
                name: '',
                email: '',
                phone: '',
                photo: '',
                bio: '',
                specialties: [],
                isActive: true,
                canAcceptBookings: true
              })
              setPhotoPreview(null)
      setUploadProgress('')
              setUploadProgress('') // Limpiar progreso
              setShowAddModal(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t('addStaffMemberBtn') || '+ Add Staff Member'}
          </button>
        </div>

        {/* Staff Grid */}
        {staff.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">
              {t('noStaffMembersFound') || 'No staff members found. Add your first staff member to get started.'}
            </p>
            <button
              onClick={() => {
                setSelectedStaff(null)
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  photo: '',
                  bio: '',
                  specialties: [],
                  isActive: true,
                  canAcceptBookings: true
                })
                setPhotoPreview(null)
                setUploadProgress('')
                setShowAddModal(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('addFirstStaffMemberBtn') || '+ Add First Staff Member'}
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Photo */}
              <div className="h-48 bg-gray-200 relative">
                {member.photo ? (
                  <img 
                    src={getImageUrl(member.photo, 'avatar', 256)}
                    srcSet={getImageSrcSet(member.photo, 'avatar')}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    alt={member.name}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    member.isActive && member.canAcceptBookings
                      ? 'bg-green-100 text-green-800'
                      : member.isActive
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.isActive && member.canAcceptBookings
                      ? (t('availableLabel') || 'Available')
                      : member.isActive
                      ? (t('busyLabel') || 'Busy')
                      : (t('inactive') || 'Inactive')}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.email}</p>
                {member.phone && (
                  <p className="text-sm text-gray-600">{member.phone}</p>
                )}
                
                {/* Rating */}
                {member.totalReviews && member.totalReviews > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(member.rating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({member.totalReviews})
                    </span>
                  </div>
                )}

                {/* Specialties */}
                {member.specialties && member.specialties.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {member.specialties.slice(0, 3).map((specialty, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                    {member.specialties.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{member.specialties.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="mt-3 pt-3 border-t flex justify-between text-sm text-gray-600">
                  <span>
                    {member._count?.appointments || 0} {t('appointmentsLower') || 'appointments'}
                  </span>
                  <span>
                    {member._count?.staffReviews || 0} {t('reviewsLower') || 'reviews'}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedStaff(member)
                      // Cargar horarios existentes del trabajador
                      const newSchedule: any = {}
                      for (let day = 0; day <= 6; day++) {
                        const existingHours = member.workingHours?.find((wh: any) => wh.dayOfWeek === day)
                        newSchedule[day] = existingHours ? {
                          isActive: existingHours.isActive,
                          startTime: existingHours.startTime,
                          endTime: existingHours.endTime
                        } : {
                          isActive: day >= 1 && day <= 5,
                          startTime: '09:00',
                          endTime: '17:00'
                        }
                      }
                      setScheduleData(newSchedule)
                      setShowScheduleModal(true)
                    }}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {t('schedule') || 'Schedule'}
                  </button>
                  <button
                    onClick={() => openEditModal(member)}
                    className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {t('edit') || 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(member.id)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                  >
                    {t('delete') || 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">{selectedStaff ? (t('editStaffMember') || 'Edit Staff Member') : (t('addStaffMember') || 'Add Staff Member')}</h2>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('name') || 'Name'} *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('email') || 'Email'} *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('phone') || 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('photo') || 'Photo'}
                    </label>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    
                    {/* Upload button and preview */}
                    <div className="flex items-start gap-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {uploadingPhoto 
                            ? (t('uploading') || 'Uploading...')
                            : (t('choosePhoto') || 'Choose Photo')
                          }
                        </button>
                        <p className="mt-2 text-xs text-gray-500">{t('anySizeImageCompressed') || 'Any size image - automatically compressed'}</p>
                        {uploadProgress && (
                          <div className="mt-2 flex items-center gap-2">
                            {uploadingPhoto && (
                              <svg className="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            <p className={`text-xs font-medium ${uploadProgress.includes('success') || uploadProgress.includes('exitosa') ? 'text-green-600' : 'text-blue-600'}`}>
                              {uploadProgress}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Preview */}
                      {(photoPreview || formData.photo) && (
                        <div className="relative group">
                          <div className={`relative ${uploadingPhoto ? 'opacity-60' : ''} transition-opacity`}>
                            <img 
                              src={photoPreview || getImageUrl(formData.photo, 'avatar', 128)}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-md border-2 border-gray-300 shadow-sm"
                            />
                            {uploadingPhoto && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-md">
                                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, photo: '' })
                              setPhotoPreview(null)
                              setUploadProgress('')
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-sm"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('bio') || 'Bio'}
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>

                  {/* Specialties */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('specialties') || 'Specialties'}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        placeholder={t('addSpecialtyPlaceholder') || 'Add specialty'}
                      />
                      <button
                        type="button"
                        onClick={handleAddSpecialty}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        {t('add') || 'Add'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties.map((specialty, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2"
                        >
                          {specialty}
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialty(specialty)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {t('active') || 'Active'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.canAcceptBookings}
                        onChange={(e) => setFormData({ ...formData, canAcceptBookings: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {t('canAcceptBookings') || 'Can Accept Bookings'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setSelectedStaff(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('cancelBtn') || 'Cancel'}
                  </button>
                  <button
                    onClick={handleSaveStaff}
                    disabled={saving || !formData.name || !formData.email}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {t('setWorkingHours') || 'Set Working Hours'} - {selectedStaff.name}
                </h2>

                {/* Apply to All Days */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">
                    {t('quickSetup') || 'Quick Setup'}
                  </h3>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">
                        {t('start') || 'Start'}
                      </label>
                      <input
                        type="time"
                        id="quickStartTime"
                        defaultValue="09:00"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">
                        {t('end') || 'End'}
                      </label>
                      <input
                        type="time"
                        id="quickEndTime"
                        defaultValue="17:00"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const quickStart = (document.getElementById('quickStartTime') as HTMLInputElement).value
                        const quickEnd = (document.getElementById('quickEndTime') as HTMLInputElement).value
                        const newSchedule = {...scheduleData}
                        for (let day = 0; day <= 6; day++) {
                          newSchedule[day] = {
                            isActive: day >= 1 && day <= 5, // Lunes a Viernes por defecto
                            startTime: quickStart,
                            endTime: quickEnd
                          }
                        }
                        setScheduleData(newSchedule)
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      {t('applyToAll') || 'Apply to All'}
                    </button>
                  </div>
                </div>

                {/* Individual Days */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {t('individualDays') || 'Individual Days'}
                  </h3>
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day.value} className="flex items-center gap-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={scheduleData[day.value]?.isActive || false}
                        onChange={(e) => {
                          setScheduleData({
                            ...scheduleData,
                            [day.value]: {
                              ...scheduleData[day.value],
                              isActive: e.target.checked
                            }
                          })
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="w-24 font-medium text-sm">{day.label}</div>
                      <input
                        type="time"
                        value={scheduleData[day.value]?.startTime || '09:00'}
                        onChange={(e) => {
                          setScheduleData({
                            ...scheduleData,
                            [day.value]: {
                              ...scheduleData[day.value],
                              startTime: e.target.value
                            }
                          })
                        }}
                        disabled={!scheduleData[day.value]?.isActive}
                        className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                      <span className="text-sm text-gray-500">-</span>
                      <input
                        type="time"
                        value={scheduleData[day.value]?.endTime || '17:00'}
                        onChange={(e) => {
                          setScheduleData({
                            ...scheduleData,
                            [day.value]: {
                              ...scheduleData[day.value],
                              endTime: e.target.value
                            }
                          })
                        }}
                        disabled={!scheduleData[day.value]?.isActive}
                        className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </div>
                  ))}
                </div>

                {/* Current Schedule */}
                {selectedStaff.workingHours && selectedStaff.workingHours.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">{t('currentSchedule') || 'Current Schedule'}</h3>
                    <div className="space-y-1 text-sm">
                      {selectedStaff.workingHours.map(wh => {
                        const day = DAYS_OF_WEEK.find(d => d.value === wh.dayOfWeek)
                        return (
                          <div key={wh.id} className="flex justify-between">
                            <span>{day?.label}</span>
                            <span>{wh.startTime} - {wh.endTime}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => {
                      setShowScheduleModal(false)
                      setSelectedStaff(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('cancelBtn') || 'Cancel'}
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

