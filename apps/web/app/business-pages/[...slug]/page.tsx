import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
const BusinessLandingEnhanced = dynamic(() => import('@/components/business/BusinessLandingEnhanced'), { ssr: false })
const ProjectLanding = dynamic(() => import('@/components/project/ProjectLanding'), { ssr: false })
import { getOperationMode } from '@/lib/operation-mode'
import { getBusinessDataByCustomSlug } from '@/lib/business-data'

interface CustomPageProps {
  params: {
    slug: string[]
  }
}

export default async function CustomBusinessPage({ params }: CustomPageProps) {
  // Join the slug array to create the full path
  const fullSlug = params.slug.join('/')
  
  const business = await getBusinessDataByCustomSlug(fullSlug)
  
  if (!business) {
    notFound()
  }

  const mode = getOperationMode((business as any).settings)
  return mode === 'PROYECTO' 
    ? <ProjectLanding business={business} />
    : <BusinessLandingEnhanced business={business} />
}

export async function generateMetadata({ params }: CustomPageProps) {
  const fullSlug = params.slug.join('/')
  const business = await getBusinessDataByCustomSlug(fullSlug)

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
