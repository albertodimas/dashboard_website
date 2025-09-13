import { PrismaClient } from '@prisma/client'

type LegacyGalleryItem = {
  id?: string
  type?: string
  url: string
  title: string
  description?: string
  category?: string
  createdAt?: string
}

async function main() {
  const prisma = new PrismaClient()
  try {
    const businesses = await prisma.business.findMany({
      select: { id: true, features: true }
    })

    let totalMigrated = 0
    for (const biz of businesses) {
      const features = (biz.features as any) || {}
      const legacy: LegacyGalleryItem[] = Array.isArray(features.gallery) ? features.gallery : []
      if (!legacy.length) continue

      // Get current max order in table for this business
      const maxOrder = await prisma.galleryItem.findFirst({
        where: { businessId: biz.id },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      let currentOrder = (maxOrder?.order || 0)

      let migratedForBiz = 0
      for (const item of legacy) {
        // Skip invalid
        if (!item || !item.url || !item.title) continue

        // Deduplicate by (url, title)
        const exists = await prisma.galleryItem.findFirst({
          where: {
            businessId: biz.id,
            url: item.url,
            title: item.title
          },
          select: { id: true }
        })
        if (exists) continue

        currentOrder += 1
        await prisma.galleryItem.create({
          data: {
            businessId: biz.id,
            type: item.type || 'image',
            url: item.url,
            title: item.title,
            description: item.description || null,
            category: item.category || null,
            order: currentOrder,
            isActive: true
          }
        })
        migratedForBiz += 1
        totalMigrated += 1
      }

      // Clear legacy only if we migrated something
      if (migratedForBiz > 0) {
        const newFeatures = { ...features, gallery: [] }
        await prisma.business.update({
          where: { id: biz.id },
          data: { features: newFeatures }
        })
        console.log(`Business ${biz.id}: migrated ${migratedForBiz} items and cleared legacy features.gallery`)
      }
    }

    console.log(`Migration completed. Total items migrated: ${totalMigrated}`)
  } catch (err) {
    console.error('Migration failed:', err)
    process.exitCode = 1
  }
}

main()

