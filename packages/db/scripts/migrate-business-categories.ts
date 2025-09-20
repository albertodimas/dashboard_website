import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function tableExists(table: string) {
  const rows = await prisma.$queryRawUnsafe(`SELECT to_regclass('public.${table}')::text as reg`) as Array<{ reg: string | null }>
  return rows?.[0]?.reg != null
}

async function main() {
  // Ensure tables exist
  await prisma.$executeRawUnsafe(`SELECT 1`)
  // Ensure helper exists if compiled output is available
  await import('./create-business-categories-tables.js').catch(() => null)

  const hasSvc = await tableExists('business_service_categories')
  const hasGal = await tableExists('business_gallery_categories')
  if (!hasSvc || !hasGal) {
    console.log('Category tables not available; aborting migration.')
    return
  }

  const businesses = await prisma.business.findMany({ select: { id: true, settings: true } })
  let svcCount = 0, galCount = 0

  for (const biz of businesses) {
    const settings: any = biz.settings || {}
    const serviceCategories: any[] = Array.isArray(settings.serviceCategories) ? settings.serviceCategories : []
    const galleryCategories: any[] = Array.isArray(settings.galleryCategories) ? settings.galleryCategories : []

    // Service categories
    for (const [idx, c] of serviceCategories.entries()) {
      const name = (c?.name || '').toString().trim()
      if (!name) continue
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO public.business_service_categories ("businessId", name, "order")
           VALUES ($1, $2, $3)
           ON CONFLICT ("businessId", name) DO UPDATE SET "order" = EXCLUDED."order"`,
          biz.id, name, c?.order ?? idx + 1
        )
        svcCount++
      } catch (e) {
        // ignore duplicates
      }
    }

    // Gallery categories
    for (const [idx, c] of galleryCategories.entries()) {
      const name = (c?.name || '').toString().trim()
      if (!name) continue
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO public.business_gallery_categories ("businessId", name, "order")
           VALUES ($1, $2, $3)
           ON CONFLICT ("businessId", name) DO UPDATE SET "order" = EXCLUDED."order"`,
          biz.id, name, c?.order ?? idx + 1
        )
        galCount++
      } catch (e) {
        // ignore duplicates
      }
    }
  }

  console.log(`Migration completed. Service categories upserted: ${svcCount}; Gallery categories upserted: ${galCount}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
