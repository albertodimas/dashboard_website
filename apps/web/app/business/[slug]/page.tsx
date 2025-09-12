import { notFound } from 'next/navigation'
import BusinessLandingEnhanced from '@/components/business/BusinessLandingEnhanced'
import { getBusinessDataBySlug } from '@/lib/business-data'

interface BusinessPageProps {
  params: {
    slug: string
  }
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const business = await getBusinessDataBySlug(params.slug)

  if (!business) {
    notFound()
  }

  // Debug log en el servidor
  console.log('[SERVER] Business data for', params.slug, {
    enablePackagesModule: business.enablePackagesModule,
    packagesCount: business.packages?.length || 0,
    packages: business.packages?.map((p: any) => ({ name: p.name, isActive: p.isActive }))
  })

  return <BusinessLandingEnhanced business={business} />
}

export async function generateMetadata({ params }: BusinessPageProps) {
  const business = await getBusinessDataBySlug(params.slug)

  if (!business) {
    return {
      title: 'Business Not Found',
      description: 'The requested business page could not be found.'
    }
  }

  return {
    title: `${business.name} - Professional ${business.category || 'Services'}`,
    description: business.description || `Visit ${business.name} for premium services. Book your appointment today!`,
    openGraph: {
      title: business.name,
      description: business.description,
      images: business.coverImage ? [business.coverImage] : [],
      type: 'website'
    },
    keywords: [
      business.name,
      business.category,
      business.city,
      'appointment',
      'booking',
      'services'
    ].filter(Boolean)
  }
}
