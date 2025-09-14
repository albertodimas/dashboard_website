'use client'

import { useMemo, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import Link from 'next/link'
import { Shield, Star, Users, MapPin, Phone, Calendar, Gift, Clock, LogIn, Mail, Instagram, Facebook, Twitter, ArrowRight, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { getGoogleMapsDirectionsUrl } from '@/lib/maps-utils'
import { getImageSrcSet, getImageUrl } from '@/lib/upload-utils-client'
import { formatCurrency } from '@/lib/format-utils'
import { useLanguage } from '@/contexts/LanguageContext'
import Lightbox from '@/components/ui/Lightbox'

interface Props { business: any }

export default function ProjectLanding({ business }: Props) {
  const toast = useToast()
  const { t, language } = useLanguage()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [form, setForm] = useState({
    serviceType: '',
    description: '',
    address: '',
    preferredContact: 'WHATSAPP',
    name: '',
    email: '',
    phone: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const reviews = business.reviews || []
  const galleryItems = business.galleryItems || []
  const staff = (business.staff || []).filter((s: any) => s.isActive)

  // Gallery/lightbox state
  const [galleryCategory, setGalleryCategory] = useState<string>('all')
  const [galleryPage, setGalleryPage] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxItems, setLightboxItems] = useState<any[]>([])
  const averageRating = useMemo(() => {
    if (reviews.length > 0) {
      const total = reviews.reduce((acc: number, r: any) => acc + (r?.rating ?? 0), 0)
      return total / reviews.length
    }
    return 5
  }, [reviews])

  const categories = Array.from(new Set((business.services || []).map((s: any) => s.category).filter(Boolean))) as string[]

  // Helper to resolve gallery image URLs from id or absolute URL
  const resolveGallerySources = (urlOrId?: string | null, size: number = 800) => {
    if (!urlOrId) return { src: '', srcSet: '' }
    const value = String(urlOrId)
    if (value.startsWith('http') || value.startsWith('/')) {
      const match = value.match(/\/gallery\/([^_]+)_\d+\.webp/i)
      const imgId = match?.[1]
      return { src: value, srcSet: imgId ? getImageSrcSet(imgId, 'gallery') : '' }
    }
    return { src: getImageUrl(value, 'gallery', size), srcSet: getImageSrcSet(value, 'gallery') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.serviceType || !form.description || !form.name || !form.email) {
      toast('Completa los campos obligatorios', 'info')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/public/project-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          serviceType: form.serviceType,
          description: form.description,
          address: form.address,
          preferredContact: form.preferredContact,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone
        })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Error al enviar solicitud')
      }
      setSuccess(true)
    } catch (err: any) {
      toast(err?.message || 'Error al enviar solicitud', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const colors = {
    primary: business.settings?.theme?.primaryColor || '#6366F1',
    accent: business.settings?.theme?.accentColor || '#F59E0B',
    gradient: `linear-gradient(135deg, ${business.settings?.theme?.primaryColor || '#6366F1'} 0%, ${business.settings?.theme?.accentColor || '#F59E0B'} 100%)`
  }

  // Working hours footer
  const scheduleSettings = business.settings?.scheduleSettings || null
  const baseWorkingHours = Array.isArray(business.workingHours) ? business.workingHours : []
  const workingHours = scheduleSettings
    ? [0,1,2,3,4,5,6].map((day: number) => ({
        dayOfWeek: day,
        isActive: Array.isArray(scheduleSettings.workingDays) ? scheduleSettings.workingDays.includes(day) : false,
        startTime: scheduleSettings.startTime || '09:00',
        endTime: scheduleSettings.endTime || '18:00'
      }))
    : baseWorkingHours.filter((wh: any) => !wh.staffId)
  const daysOfWeek = [
    t('sunday'),
    t('monday'),
    t('tuesday'),
    t('wednesday'),
    t('thursday'),
    t('friday'),
    t('saturday')
  ]
  const todayIdx = new Date().getDay()
  const todayWh = (workingHours || []).find((wh: any) => wh.dayOfWeek === todayIdx)
  const todayHoursText = todayWh && todayWh.isActive ? `${todayWh.startTime} - ${todayWh.endTime}` : t('todayClosed')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 w-full backdrop-blur-xl bg-white/70 border-b border-gray-100 z-50 shadow-sm">
        <nav className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {business.logo && (
                <div className="relative">
                  <img
                    src={business.logo.startsWith('data:') ? business.logo : getImageUrl(business.logo, 'business', 256)}
                    srcSet={business.logo.startsWith('data:') ? '' : getImageSrcSet(business.logo, 'business')}
                    sizes="(max-width: 640px) 48px, 64px"
                    alt={business.name}
                    className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl object-cover shadow-md border-2 border-white/20"
                    loading="eager"
                  />
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                  {business.name}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">{business.category || t('professionalServices')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-4 sm:px-6 py-2.5 font-semibold text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: colors.gradient }}
              >
                {t('requestQuote')}
              </button>
              <LanguageSelector />
            </div>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="relative container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-gray-700" />
              <span className="text-gray-700 text-sm">{t('verifiedBusiness')}</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-4">{business.name}</h1>
            <p className="text-lg sm:text-xl text-gray-700 mb-8 leading-relaxed">
              {business.description || t('projectHero')}
            </p>
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border">
                <Users className="w-5 h-5" />
                <span className="font-semibold">{business.stats?.completedAppointments || 0}+ trabajos</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-semibold">{averageRating.toFixed(1)} ({reviews.length} {t('reviewsLower') || 'reviews'})</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-8 py-4 text-white rounded-full font-bold transition-all duration-300"
                style={{ background: colors.gradient }}
              >
                {t('requestQuote')}
              </button>
              <a href="#services" className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold border">
                {t('services')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Bar with today schedule */}
      <section className="bg-white border-y">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" style={{ color: colors.primary }} />
              <div>
                <p className="font-semibold">{todayHoursText}</p>
              </div>
            </div>
            {business.address && (
              <a 
                href="#contact"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
              >
                <div className="relative">
                  <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 group-hover:text-gray-700">📍 {t('address')}</p>
                  <p className="font-semibold group-hover:underline">
                    {business.address}{business.city && `, ${business.city}`}
                  </p>
                </div>
              </a>
            )}
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" style={{ color: colors.primary }} />
              <div>
                <p className="text-xs text-gray-500">{t('phone')}</p>
                <p className="font-semibold">{business.phone || (t('contact') || 'Contact')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
              <div>
                <p className="text-xs text-gray-500">{t('projectMode')}</p>
                <p className="font-semibold">{t('projectMode')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services simple grid */}
      <section id="services" className="py-10 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
              {t('services')}
            </span>
            <h2 className="text-3xl font-black mt-2 mb-2">{t('whatWeOffer')}</h2>
            <p className="text-gray-600">{t('tailoredToYourNeeds')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(business.services || []).map((service: any) => (
              <div key={service.id} className="bg-white rounded-xl shadow-sm p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">{service.name}</h3>
                  <div className="text-xl font-bold" style={{ color: colors.primary }}>
                    {formatCurrency(service.price)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{service.description || (t('professionalService') || 'Professional service')}</p>
                <button
                  onClick={() => { setShowRequestModal(true); setForm(f => ({ ...f, serviceType: service.category || service.name })) }}
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ background: colors.gradient }}
                >
                  {t('requestThisService') || 'Request this service'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section (project mode) */}
      {galleryItems.length > 0 && (
        <section id="gallery" className="py-10 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                {t('gallery')}
              </span>
              <h2 className="text-3xl font-black mt-2 mb-2">{t('ourWork')}</h2>
              <p className="text-gray-600">{t('seeOurQuality')}</p>
            </div>

            {(() => {
              const configured = (business.settings?.galleryCategories || [])
                .slice().sort((a: any,b: any) => (a.order||0)-(b.order||0)).map((c: any) => c.name)
              const derived = Array.from(new Set(galleryItems.filter((it: any) => (it.type||'image')==='image').map((it: any)=>it.category).filter(Boolean))) as string[]
              const categories = configured.length ? configured : derived
              if (categories.length > 1) {
                return (
                  <div className="flex justify-center mb-8">
                    <div className="inline-flex flex-wrap gap-2 p-1 bg-gray-100 rounded-full">
                      <button onClick={() => { setGalleryCategory('all'); setGalleryPage(0) }} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${galleryCategory==='all'?'bg-white text-gray-900 shadow-sm':'text-gray-600 hover:text-gray-900'}`}>{t('all')}</button>
                      {categories.map((c) => (
                        <button key={c} onClick={() => { setGalleryCategory(c); setGalleryPage(0) }} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${galleryCategory===c?'bg-white text-gray-900 shadow-sm':'text-gray-600 hover:text-gray-900'}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                )
              }
              return null
            })()}

            {(() => {
              const imagesOnly = galleryItems.filter((it: any) => (it.type||'image')==='image')
              const filtered = galleryCategory==='all' ? imagesOnly : imagesOnly.filter((it:any)=> (it.category||'')===galleryCategory)
              const perPage = 6
              const pages = Math.ceil((filtered.length||0)/perPage)
              const start = galleryPage*perPage
              const pageItems = filtered.slice(start,start+perPage)

              return (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pageItems.map((item:any, idx:number) => {
                      const { src, srcSet } = resolveGallerySources(item.url || item.id, 1000)
                      return (
                        <div key={item.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                          <div className="h-56 overflow-hidden">
                            <img
                              onClick={() => { setLightboxItems(filtered); setLightboxIndex(start+idx); setIsLightboxOpen(true) }}
                              src={src}
                              srcSet={srcSet}
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              alt={item.title || 'Gallery'}
                              className="w-full h-full object-cover cursor-zoom-in group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                          {(item.title || item.category) && (
                            <div className="p-4">
                              <div className="flex items-center gap-2">
                                {item.category && (<span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">{item.category}</span>)}
                                {item.title && (<h3 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h3>)}
                              </div>
                              {item.description && (<p className="mt-1 text-sm text-gray-600 line-clamp-2">{item.description}</p>)}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {pages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-10">
                      <button onClick={() => setGalleryPage(Math.max(0,galleryPage-1))} disabled={galleryPage===0} className={`p-2 rounded-full transition-all ${galleryPage===0?'bg-gray-100 text-gray-400 cursor-not-allowed':'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'}`}>
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="flex gap-2">
                        {Array.from({length: pages},(_,i)=> (
                          <button key={i} onClick={()=>setGalleryPage(i)} className={`w-10 h-10 rounded-full font-medium transition-all ${i===galleryPage?'text-white shadow-lg transform scale-110':'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'}`} style={{ background: i===galleryPage ? `${colors.gradient}` : undefined }}>{i+1}</button>
                        ))}
                      </div>
                      <button onClick={() => setGalleryPage(Math.min(pages-1,galleryPage+1))} disabled={galleryPage===pages-1} className={`p-2 rounded-full transition-all ${galleryPage===pages-1?'bg-gray-100 text-gray-400 cursor-not-allowed':'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'}`}>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {filtered.length > perPage && (
                    <p className="text-center text-sm text-gray-500 mt-4">Mostrando {start+1}-{Math.min(start+perPage, filtered.length)} de {filtered.length} imágenes</p>
                  )}
                </>
              )
            })()}
          </div>
        </section>
      )}

      {/* Team Section (after gallery) */}
      {staff.length > 0 && (
        <section className="py-10 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>{t('team')}</span>
              <h2 className="text-3xl font-black mt-2 mb-2">{t('ourProfessionals')}</h2>
              <p className="text-gray-600">{t('meetOurTeam')}</p>
            </div>
            <div className={`grid gap-6 ${staff.length === 1 ? 'max-w-sm mx-auto' : staff.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : staff.length === 3 ? 'sm:grid-cols-3 max-w-4xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
              {staff.map((member: any) => (
                <div key={member.id} className="text-center group">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200">
                      {member.photo ? (
                        <img src={member.photo.startsWith('data:') ? member.photo : getImageUrl(member.photo, 'avatar', 256)} srcSet={member.photo.startsWith('data:') ? '' : getImageSrcSet(member.photo, 'avatar')} sizes="128px" alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><User className="w-16 h-16 text-gray-400" /></div>
                      )}
                    </div>
                    {(member.rating && member.rating > 0) ? (
                      <div className="absolute bottom-0 right-1/2 translate-x-1/2 bg-white rounded-full px-3 py-1 shadow-lg flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold">{member.rating}</span>
                      </div>
                    ) : null}
                  </div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox overlay */}
      {isLightboxOpen && (
        <Lightbox
          items={lightboxItems.map((it: any) => { const { src } = resolveGallerySources(it.url || it.id, 1200); return { src, title: it.title, description: it.description } })}
          index={lightboxIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}

      {/* Reviews Section (homogeneous styling) */}
      {reviews.length > 0 && (
        <section id="reviews" className="py-10 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                {t('reviewsTitle')}
              </span>
              <h2 className="text-3xl font-black mt-2 mb-2">{t('whatClientsSay')}</h2>
              <p className="text-gray-600">{t('reviewsSubtitle')}</p>

              <div className="flex items-center justify-center gap-4 mt-8">
                <div className="text-5xl font-bold" style={{ color: colors.primary }}>
                  {averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-6 h-6"
                        fill={i < Math.round(averageRating) ? colors.accent : 'none'}
                        color={colors.accent}
                      />
                    ))}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{`${t('basedOn')} ${reviews.length} ${t('reviewsLower')}`}</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review: any) => (
                <div key={review.id} className="bg-white rounded-xl border shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4" fill={colors.accent} color={colors.accent} />
                    ))}
                  </div>
                  {review.comment && <p className="text-gray-700 text-sm">{review.comment}</p>}
                  <p className="text-xs text-gray-500 mt-3">{review.customer?.name || 'Cliente'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t('projectRequest') || 'Project Request'}</h2>
                <button onClick={() => { setShowRequestModal(false); setSuccess(false) }} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
              </div>
            </div>
            <div className="p-6">
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">{t('serviceType') || 'Service type'}</label>
                    <select
                      value={form.serviceType}
                      onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                      required
                    >
                      <option value="">{t('select') || 'Select'}</option>
                      {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">{t('descriptionTitle') || 'Description'}</label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder={t('tellUsWhatYouNeed') || 'Tell us what you need'}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">{t('address')}</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder={t('optional') || 'Optional'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">{t('preferredContact') || 'Preferred contact'}</label>
                    <div className="flex gap-3">
                      {['WHATSAPP','CALL','EMAIL'].map(m => (
                        <label key={m} className="flex items-center gap-2">
                          <input type="radio" name="pc" value={m} checked={form.preferredContact===m} onChange={() => setForm({ ...form, preferredContact: m })} />
                          <span className="text-sm">{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">{t('name') || 'Name'}</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">{t('email')}</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">{t('phone')}</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder={t('optional') || 'Optional'}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                    style={{ background: colors.gradient }}
                  >
                    {submitting ? (t('sending') || 'Sending...') : (t('sendRequest') || 'Send Request')}
                  </button>
                </form>
              ) : (
                <div className="text-center py-10">
                  <h3 className="text-xl font-bold mb-2">{t('requestSent') || 'Request sent!'}</h3>
                  <p className="text-gray-600">{t('weWillContactSoon') || 'We will contact you soon to coordinate next steps.'}</p>
                  <button onClick={() => { setShowRequestModal(false); setSuccess(false) }} className="mt-6 px-4 py-2 bg-gray-200 rounded-lg">{t('close')}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact Section mejorada (igual a reservas) */}
      <section id="contact" className="py-2 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-2">
            {/* Info */}
            <div>
              <h2 className="text-base font-bold mb-1">{t('contactInformation')}</h2>

              <div className="space-y-1 mb-2">
                {business.address && (
                  <a
                    href={getGoogleMapsDirectionsUrl(business.address, business.city, business.state)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 hover:bg-white/5 p-2 -ml-2 rounded-lg transition-colors group"
                    title={t('seeRoute') + ' - Google Maps'}
                  >
                    <div className="relative">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.accent }} />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-1">
                        {t('address')}
                        <span className="text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          ({t('seeRoute')})
                        </span>
                      </p>
                      <p className="text-gray-300 text-sm group-hover:text-white transition-colors">
                        {business.address}{business.city ? `, ${business.city}` : ''}{business.state ? `, ${business.state}` : ''}
                      </p>
                    </div>
                  </a>
                )}

                {business.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.accent }} />
                    <div>
                      <p className="font-semibold text-sm">{t('phone')}</p>
                      <p className="text-gray-300 text-sm">{business.phone}</p>
                    </div>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.accent }} />
                    <div>
                      <p className="font-semibold text-sm">{t('email')}</p>
                      <p className="text-gray-300 text-sm">{business.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Social media */}
              <div>
                <p className="font-semibold mb-1 text-xs">{t('followUs')}</p>
                <div className="flex gap-2">
                  <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div className="flex flex-col items-end">
              <h2 className="text-base font-bold mb-1 w-full text-right">{t('schedule')}</h2>

              <div className="space-y-0.5 w-auto">
                {[1, 2, 3, 4, 5, 6, 0].map(day => {  // Lunes primero, Domingo último
                  const dayHours = (workingHours || []).find((wh: any) => wh.dayOfWeek === day)
                  const isToday = new Date().getDay() === day

                  return (
                    <div
                      key={day}
                      className={`flex items-center py-0.5 px-2 rounded text-xs ${
                        isToday ? 'bg-white/10' : ''
                      }`}
                    >
                      <span className={`font-medium text-right w-20 ${isToday ? 'text-white' : 'text-gray-400'}`}>
                        {daysOfWeek[day]}
                      </span>
                      <span className={`ml-4 text-right min-w-[110px] ${isToday ? (dayHours?.isActive ? 'text-green-300' : 'text-red-300') : (dayHours?.isActive ? 'text-gray-300' : 'text-gray-500 line-through')}`}>
                        {dayHours && dayHours.isActive
                          ? `${dayHours.startTime} - ${dayHours.endTime}`
                          : t('todayClosed')}
                      </span>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => setShowRequestModal(true)}
                className="mt-1 px-4 py-1 rounded font-semibold text-xs text-gray-900 bg-white hover:bg-gray-100 transition-all duration-300"
              >
                {t('requestQuote')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Map Button */}
      {business.address && (
        <div className="fixed bottom-20 right-4 z-40">
          <a
            href={getGoogleMapsDirectionsUrl(business.address, business.city, business.state)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
            title={t('seeRoute') + ' - Google Maps'}
          >
            <div className="relative">
              <MapPin className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
            <span className="font-medium text-sm hidden sm:inline">{t('howToGetThere')}</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      )}

      {/* Footer */}
      <footer className="py-3 text-center text-white" style={{ background: colors.gradient }}>
        <p className="text-xs">&copy; {new Date().getFullYear()} {business.name}. {t('allRightsReserved') || 'All rights reserved.'}</p>
      </footer>
    </div>
  )
}
