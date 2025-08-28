import { Star, MapPin, Phone, Mail, Clock } from 'lucide-react'

interface BusinessLandingServerProps {
  business: any
}

export default function BusinessLandingServer({ business }: BusinessLandingServerProps) {
  const colors = {
    primary: business.settings?.theme?.primaryColor || '#8B5CF6',
    accent: business.settings?.theme?.accentColor || '#F59E0B'
  }

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  // Log para debug
  console.log('[SERVER COMPONENT] BusinessLandingServer:', {
    reviewsCount: business.reviews?.length || 0,
    galleryCount: business.galleryItems?.length || 0,
    staffCount: business.staff?.length || 0,
    workingHoursCount: business.workingHours?.length || 0
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {business.name}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {business.description || 'Servicios profesionales de calidad'}
            </p>
            <div className="flex justify-center gap-8">
              <div>
                <div className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {business.stats?.completedAppointments || 0}
                </div>
                <div className="text-gray-600">Clientes Felices</div>
              </div>
              <div>
                <div className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {business.stats?.averageRating?.toFixed(1) || '5.0'}
                </div>
                <div className="text-gray-600">Calificación</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestros Servicios</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {business.services?.map((service: any) => (
              <div key={service.id} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">
                    <Clock className="inline w-4 h-4 mr-1" />
                    {service.duration} min
                  </span>
                  <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                    ${service.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      {business.packages && business.packages.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Paquetes Especiales</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {business.packages.map((pkg: any) => (
                <div key={pkg.id} className="bg-white rounded-lg p-6 shadow">
                  <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 mb-4">{pkg.description}</p>
                  <div className="mb-4">
                    {pkg.services?.map((ps: any) => (
                      <div key={ps.id} className="text-sm text-gray-600">
                        • {ps.service?.name} (x{ps.quantity})
                      </div>
                    ))}
                  </div>
                  <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                    ${pkg.price}
                    {pkg.discount > 0 && (
                      <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        {pkg.discount}% OFF
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section - SIEMPRE VISIBLE PARA DEBUG */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Galería</h2>
          <div className="text-center mb-8 text-red-500">
            Total de imágenes: {business.galleryItems?.length || 0}
          </div>
          {business.galleryItems && business.galleryItems.length > 0 ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {business.galleryItems.map((item: any, index: number) => (
                <div key={item.id || index} className="relative aspect-square rounded-lg overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.title || 'Imagen de galería'}
                    className="w-full h-full object-cover"
                  />
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                      {item.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No hay imágenes en la galería</p>
          )}
        </div>
      </section>

      {/* Reviews Section - SIEMPRE VISIBLE PARA DEBUG */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Reseñas de Clientes</h2>
          <div className="text-center mb-8 text-red-500">
            Total de reseñas: {business.reviews?.length || 0}
          </div>
          {business.reviews && business.reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {business.reviews.map((review: any) => (
                <div key={review.id} className="bg-white rounded-lg p-6 shadow">
                  <div className="flex items-center mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5"
                          fill={i < review.rating ? colors.accent : 'none'}
                          color={colors.accent}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{review.comment}</p>
                  <p className="text-sm text-gray-500">- {review.customer?.name || 'Cliente'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No hay reseñas disponibles</p>
          )}
        </div>
      </section>

      {/* Staff Section */}
      {business.staff && business.staff.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Nuestro Equipo</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {business.staff.map((member: any) => (
                <div key={member.id} className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-3xl text-gray-600">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="text-gray-600">{member.email}</p>
                  {member.phone && <p className="text-gray-600">{member.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact & Working Hours */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Contacto y Horarios</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Contact */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Contáctanos</h3>
              <div className="space-y-3">
                {business.address && (
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3" style={{ color: colors.primary }} />
                    <span>{business.address}, {business.city}, {business.state}</span>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-3" style={{ color: colors.primary }} />
                    <span>{business.phone}</span>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-3" style={{ color: colors.primary }} />
                    <span>{business.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Horario de Atención</h3>
              <div className="space-y-2">
                {[0, 1, 2, 3, 4, 5, 6].map(day => {
                  const dayHours = business.workingHours?.find((wh: any) => wh.dayOfWeek === day && !wh.staffId)
                  return (
                    <div key={day} className="flex justify-between">
                      <span className="font-medium">{daysOfWeek[day]}</span>
                      <span className="text-gray-600">
                        {dayHours && dayHours.isActive
                          ? `${dayHours.startTime} - ${dayHours.endTime}`
                          : 'Cerrado'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}