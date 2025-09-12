import { notFound } from 'next/navigation'
import BusinessLandingEnhanced from '@/components/business/BusinessLandingEnhanced'
import { getBusinessDataByCustomSlug } from '@/lib/business-data'

interface CustomPageProps {
  params: {
    slug: string
  }
}

// Lista de rutas reservadas del sistema que no pueden ser usadas como slugs
const RESERVED_ROUTES = [
  'login',
  'register',
  'dashboard',
  'api',
  'admin',
  'auth',
  'business',
  'settings',
  'profile',
  'logout',
  'signup',
  'signin',
  'forgot-password',
  'reset-password',
  'verify',
  'confirm',
  'public',
  'static',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml'
]

export default async function CustomBusinessPage({ params }: CustomPageProps) {
  // Si es una ruta reservada, devolver 404
  if (RESERVED_ROUTES.includes(params.slug.toLowerCase())) {
    notFound()
  }

  const business = await getBusinessDataByCustomSlug(params.slug)
  
  if (!business) {
    notFound()
  }

  return <BusinessLandingEnhanced business={business} />
}

export async function generateMetadata({ params }: CustomPageProps) {
  // Si es una ruta reservada, devolver metadata de no encontrado
  if (RESERVED_ROUTES.includes(params.slug.toLowerCase())) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.'
    }
  }

  const business = await getBusinessDataByCustomSlug(params.slug)

  if (!business) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.'
    }
  }

  return {
    title: `${business.name} - Professional Services`,
    description: business.description || `Visit ${business.name} for premium services. Book your appointment today!`,
    openGraph: {
      title: business.name,
      description: business.description,
      images: business.coverImage ? [business.coverImage] : [],
      type: 'website'
    },
    keywords: [
      business.name,
      business.city,
      'appointment',
      'booking',
      'services'
    ].filter(Boolean)
  }
}
