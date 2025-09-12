'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Shield, Star, Users, MapPin, Phone, Calendar, Gift, Clock, LogIn } from 'lucide-react'
import { getImageSrcSet, getImageUrl } from '@/lib/upload-utils-client'
import { formatCurrency } from '@/lib/format-utils'

interface Props { business: any }

export default function ProjectLanding({ business }: Props) {
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
  const averageRating = useMemo(() => {
    if (reviews.length > 0) {
      const total = reviews.reduce((acc: number, r: any) => acc + (r?.rating ?? 0), 0)
      return total / reviews.length
    }
    return 5
  }, [reviews])

  const categories = Array.from(new Set((business.services || []).map((s: any) => s.category).filter(Boolean))) as string[]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.serviceType || !form.description || !form.name || !form.email) {
      alert('Completa los campos obligatorios')
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
      alert(err?.message || 'Error al enviar solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const colors = {
    primary: business.settings?.theme?.primaryColor || '#6366F1',
    accent: business.settings?.theme?.accentColor || '#F59E0B',
    gradient: `linear-gradient(135deg, ${business.settings?.theme?.primaryColor || '#6366F1'} 0%, ${business.settings?.theme?.accentColor || '#F59E0B'} 100%)`
  }

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
                <p className="text-xs text-gray-500 hidden sm:block">{business.category || 'Servicios Profesionales'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-4 sm:px-6 py-2.5 font-semibold text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: colors.gradient }}
              >
                Solicitar Presupuesto
              </button>
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
              <span className="text-gray-700 text-sm">Negocio Verificado</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-4">{business.name}</h1>
            <p className="text-lg sm:text-xl text-gray-700 mb-8 leading-relaxed">
              {business.description || 'Cuéntanos tu proyecto y coordinamos contigo los próximos pasos.'}
            </p>
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border">
                <Users className="w-5 h-5" />
                <span className="font-semibold">{business.stats?.completedAppointments || 0}+ trabajos</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-semibold">{averageRating.toFixed(1)} ({reviews.length} reseñas)</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-8 py-4 text-white rounded-full font-bold transition-all duration-300"
                style={{ background: colors.gradient }}
              >
                Solicitar Presupuesto
              </button>
              <a href="#services" className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold border">
                Ver Servicios
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services simple grid */}
      <section id="services" className="py-10 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
              Servicios
            </span>
            <h2 className="text-3xl font-black mt-2 mb-2">Lo que ofrecemos</h2>
            <p className="text-gray-600">Selecciona un tipo en el formulario para agilizar tu solicitud.</p>
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
                <p className="text-sm text-gray-600 mb-4">{service.description || 'Servicio profesional'}</p>
                <button
                  onClick={() => { setShowRequestModal(true); setForm(f => ({ ...f, serviceType: service.category || service.name })) }}
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ background: colors.gradient }}
                >
                  Solicitar este servicio
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Solicitud de Proyecto</h2>
                <button onClick={() => { setShowRequestModal(false); setSuccess(false) }} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
              </div>
            </div>
            <div className="p-6">
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de servicio</label>
                    <select
                      value={form.serviceType}
                      onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                      required
                    >
                      <option value="">Selecciona</option>
                      {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder="Cuéntanos qué necesitas"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Dirección</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Preferencia de contacto</label>
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
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
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
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder="Opcional"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                    style={{ background: colors.gradient }}
                  >
                    {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-10">
                  <h3 className="text-xl font-bold mb-2">¡Solicitud enviada!</h3>
                  <p className="text-gray-600">Te contactaremos pronto para coordinar los próximos pasos.</p>
                  <button onClick={() => { setShowRequestModal(false); setSuccess(false) }} className="mt-6 px-4 py-2 bg-gray-200 rounded-lg">Cerrar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

