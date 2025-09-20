import { notFound } from 'next/navigation'
import BusinessLandingEnhanced from '@/components/business/BusinessLandingEnhanced'
import ProjectLanding from '@/components/project/ProjectLanding'
import { getOperationMode } from '@/lib/operation-mode'
import { getBusinessDataBySlug } from '@/lib/business-data'
import { logger } from '@/lib/logger'

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
  logger.info('[SERVER] Business data for', params.slug, {
    enablePackagesModule: business.enablePackagesModule,
    packagesCount: business.packages?.length || 0,
    packages: business.packages?.map((p: any) => ({ name: p.name, isActive: p.isActive }))
  })

  const mode = getOperationMode((business as any).settings)
  return mode === 'PROYECTO' 
    ? <ProjectLanding business={business} />
    : <BusinessLandingEnhanced business={business} />
}

export async function generateMetadata({ params }: BusinessPageProps) {
  const business = await getBusinessDataBySlug(params.slug)

  if (!business) {
    return {
      title: 'Business Not Found',
      description: 'The requested business page could not be found.'
    }
  }

  const categoryName =
    (business as { category?: string | null } | null)?.category ??
    ((business as { categories?: Array<{ name?: string | null }> } | null)?.categories?.[0]?.name ?? 'Services')

  const description = business.description || `Visit ${business.name} for premium services. Book your appointment today!`

  return {
    title: `${business.name} - Professional ${categoryName}`,
    description,
    openGraph: {
      title: business.name,
      description,
      images: business.coverImage ? [business.coverImage] : [],
      type: 'website',
    },
    keywords: [
      business.name,
      categoryName,
      business.city,
      'appointment',
      'booking',
      'services',
    ].filter(Boolean),
  }
}
