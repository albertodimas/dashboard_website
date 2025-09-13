import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create tables if they do not exist (idempotent)
  // Service categories DDL
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.business_service_categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "businessId" uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
      name citext NOT NULL,
      "order" integer NOT NULL DEFAULT 0,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS business_service_categories_unique_name
      ON public.business_service_categories ("businessId", name)
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS business_service_categories_business
      ON public.business_service_categories ("businessId")
  `)

  // Gallery categories DDL
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.business_gallery_categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "businessId" uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
      name citext NOT NULL,
      "order" integer NOT NULL DEFAULT 0,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS business_gallery_categories_unique_name
      ON public.business_gallery_categories ("businessId", name)
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS business_gallery_categories_business
      ON public.business_gallery_categories ("businessId")
  `)

  console.log('Tables ensured: business_service_categories, business_gallery_categories')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
