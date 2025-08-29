'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { useLanguage } from '@/contexts/LanguageContext'
import { getImageUrl, getImageSrcSet } from '@/lib/upload-utils-client'
import { compressImage, formatFileSize } from '@/lib/image-resize-client'

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
  const { t } = useLanguage()
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
  
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [scheduleData, setScheduleData] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isActive: true
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
        setStaff(data)
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
      alert(t('language') === 'en' ? 'Please select an image file' : 'Por favor selecciona un archivo de imagen')
      return
    }

    setUploadingPhoto(true)
    
    try {
      // Mostrar tamaño original
      const originalSize = formatFileSize(originalFile.size)
      setUploadProgress(
        t('language') === 'en' 
          ? `Processing image (${originalSize})...` 
          : `Procesando imagen (${originalSize})...`
      )

      // Comprimir imagen automáticamente si es necesaria
      let fileToUpload = originalFile
      
      // Si la imagen es mayor a 5MB, comprimirla
      if (originalFile.size > 5 * 1024 * 1024) {
        setUploadProgress(
          t('language') === 'en' 
            ? 'Compressing image...' 
            : 'Comprimiendo imagen...'
        )
        
        fileToUpload = await compressImage(originalFile, 5) // Comprimir a máximo 5MB
        
        const newSize = formatFileSize(fileToUpload.size)
        setUploadProgress(
          t('language') === 'en' 
            ? `Image compressed from ${originalSize} to ${newSize}` 
            : `Imagen comprimida de ${originalSize} a ${newSize}`
        )
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

      setUploadProgress(
        t('language') === 'en' 
          ? 'Uploading image...' 
          : 'Subiendo imagen...'
      )

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
      
      setUploadProgress(
        t('language') === 'en' 
          ? 'Image uploaded successfully!' 
          : '¡Imagen subida exitosamente!'
      )
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setUploadProgress(''), 3000)
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert(t('language') === 'en' ? 'Failed to upload image' : 'Error al subir la imagen')
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
      alert(t('language') === 'en' ? 'Failed to save staff member' : 'Error al guardar el trabajador')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm(t('language') === 'en' 
      ? 'Are you sure you want to delete this staff member?' 
      : '¿Estás seguro de que quieres eliminar este trabajador?')) {
      return
    }

    try {
      const response = await fetch(`/api/dashboard/staff?id=${staffId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete')
      }

      await loadStaff()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleSaveSchedule = async () => {
    if (!selectedStaff) return

    try {
      setSaving(true)
      
      const response = await fetch(`/api/dashboard/staff/${selectedStaff.id}/working-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      })

      if (!response.ok) {
        throw new Error('Failed to save schedule')
      }

      await loadStaff()
      alert(t('language') === 'en' ? 'Schedule saved successfully' : 'Horario guardado exitosamente')
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert(t('language') === 'en' ? 'Failed to save schedule' : 'Error al guardar el horario')
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
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">
            {t('language') === 'en' ? 'Staff Module Not Enabled' : 'Módulo de Trabajadores No Habilitado'}
          </h2>
          <p className="text-yellow-700">
            {t('language') === 'en' 
              ? 'The staff management module is not enabled for your business. Please contact the administrator to enable this feature.'
              : 'El módulo de gestión de trabajadores no está habilitado para tu negocio. Por favor contacta al administrador para habilitar esta función.'}
          </p>
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
              {t('language') === 'en' ? 'Staff Management' : 'Gestión de Trabajadores'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('language') === 'en' 
                ? 'Manage your staff members, schedules, and availability'
                : 'Gestiona tus trabajadores, horarios y disponibilidad'}
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
            {t('language') === 'en' ? '+ Add Staff Member' : '+ Agregar Trabajador'}
          </button>
        </div>

        {/* Staff Grid */}
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
                      ? (t('language') === 'en' ? 'Available' : 'Disponible')
                      : member.isActive
                      ? (t('language') === 'en' ? 'Busy' : 'Ocupado')
                      : (t('language') === 'en' ? 'Inactive' : 'Inactivo')}
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
                    {member._count?.appointments || 0} {t('language') === 'en' ? 'appointments' : 'citas'}
                  </span>
                  <span>
                    {member._count?.staffReviews || 0} {t('language') === 'en' ? 'reviews' : 'reseñas'}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedStaff(member)
                      setShowScheduleModal(true)
                    }}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {t('language') === 'en' ? 'Schedule' : 'Horario'}
                  </button>
                  <button
                    onClick={() => openEditModal(member)}
                    className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {t('language') === 'en' ? 'Edit' : 'Editar'}
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(member.id)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                  >
                    {t('language') === 'en' ? 'Delete' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {selectedStaff 
                    ? (t('language') === 'en' ? 'Edit Staff Member' : 'Editar Trabajador')
                    : (t('language') === 'en' ? 'Add Staff Member' : 'Agregar Trabajador')}
                </h2>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('language') === 'en' ? 'Name' : 'Nombre'} *
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
                      {t('language') === 'en' ? 'Email' : 'Correo'} *
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
                      {t('language') === 'en' ? 'Phone' : 'Teléfono'}
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
                      {t('language') === 'en' ? 'Photo' : 'Foto'}
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
                            ? (t('language') === 'en' ? 'Uploading...' : 'Subiendo...')
                            : (t('language') === 'en' ? 'Choose Photo' : 'Elegir Foto')
                          }
                        </button>
                        <p className="mt-2 text-xs text-gray-500">
                          {t('language') === 'en' 
                            ? 'Any size image - automatically compressed' 
                            : 'Cualquier tamaño - se comprime automáticamente'}
                        </p>
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
                      {t('language') === 'en' ? 'Bio' : 'Biografía'}
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
                      {t('language') === 'en' ? 'Specialties' : 'Especialidades'}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        placeholder={t('language') === 'en' ? 'Add specialty' : 'Agregar especialidad'}
                      />
                      <button
                        type="button"
                        onClick={handleAddSpecialty}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        {t('language') === 'en' ? 'Add' : 'Agregar'}
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
                        {t('language') === 'en' ? 'Active' : 'Activo'}
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
                        {t('language') === 'en' ? 'Can Accept Bookings' : 'Puede Aceptar Reservas'}
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
                    {t('language') === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button
                    onClick={handleSaveStaff}
                    disabled={saving || !formData.name || !formData.email}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving 
                      ? (t('language') === 'en' ? 'Saving...' : 'Guardando...')
                      : (t('language') === 'en' ? 'Save' : 'Guardar')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {t('language') === 'en' ? 'Set Working Hours' : 'Configurar Horario'} - {selectedStaff.name}
                </h2>

                <div className="space-y-4">
                  {/* Day */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('language') === 'en' ? 'Day of Week' : 'Día de la Semana'}
                    </label>
                    <select
                      value={scheduleData.dayOfWeek}
                      onChange={(e) => setScheduleData({ ...scheduleData, dayOfWeek: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day.value} value={day.value}>
                          {t('language') === 'en' ? day.label : day.labelEs}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('language') === 'en' ? 'Start Time' : 'Hora de Inicio'}
                    </label>
                    <input
                      type="time"
                      value={scheduleData.startTime}
                      onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('language') === 'en' ? 'End Time' : 'Hora de Fin'}
                    </label>
                    <input
                      type="time"
                      value={scheduleData.endTime}
                      onChange={(e) => setScheduleData({ ...scheduleData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Active */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={scheduleData.isActive}
                      onChange={(e) => setScheduleData({ ...scheduleData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t('language') === 'en' ? 'Active' : 'Activo'}
                    </span>
                  </label>
                </div>

                {/* Current Schedule */}
                {selectedStaff.workingHours && selectedStaff.workingHours.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {t('language') === 'en' ? 'Current Schedule' : 'Horario Actual'}
                    </h3>
                    <div className="space-y-1 text-sm">
                      {selectedStaff.workingHours.map(wh => {
                        const day = DAYS_OF_WEEK.find(d => d.value === wh.dayOfWeek)
                        return (
                          <div key={wh.id} className="flex justify-between">
                            <span>{t('language') === 'en' ? day?.label : day?.labelEs}</span>
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
                    {t('language') === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving 
                      ? (t('language') === 'en' ? 'Saving...' : 'Guardando...')
                      : (t('language') === 'en' ? 'Save' : 'Guardar')}
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