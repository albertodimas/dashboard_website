import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Buscar el business
  const business = await prisma.business.findFirst({
    where: {
      customSlug: 'wmc/welcome'
    }
  });

  if (!business) {
    console.log('Business not found');
    return;
  }

  // Actualizar todas las reviews para que estén publicadas
  const result = await prisma.review.updateMany({
    where: {
      businessId: business.id,
      isPublished: false
    },
    data: {
      isPublished: true,
      publishedAt: new Date()
    }
  });

  console.log(`Updated ${result.count} reviews to published`);

  // Verificar el estado de las reviews
  const reviews = await prisma.review.findMany({
    where: { businessId: business.id },
    select: {
      id: true,
      isPublished: true,
      rating: true,
      comment: true
    }
  });

  console.log('\nAll reviews:');
  reviews.forEach(r => {
    console.log(`- ${r.id}: Published=${r.isPublished}, Rating=${r.rating}`);
  });

  // También activar todos los gallery items
  await prisma.galleryItem.updateMany({
    where: {
      businessId: business.id,
      isActive: false
    },
    data: {
      isActive: true
    }
  });

  console.log('\nGallery items activated');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });