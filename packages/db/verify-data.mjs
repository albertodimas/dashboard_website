import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Buscar el business con customSlug
  const business = await prisma.business.findFirst({
    where: {
      customSlug: 'wmc/welcome'
    }
  });

  if (!business) {
    console.log('Business not found with customSlug: wmc/welcome');
    return;
  }

  console.log('Business found:', business.name, 'ID:', business.id);

  // Verificar reviews
  const reviews = await prisma.review.findMany({
    where: { businessId: business.id }
  });
  console.log(`\nReviews: ${reviews.length}`, reviews.map(r => ({ id: r.id, rating: r.rating })));

  // Verificar gallery items
  const galleryItems = await prisma.galleryItem.findMany({
    where: { businessId: business.id }
  });
  console.log(`\nGallery Items: ${galleryItems.length}`, galleryItems.map(g => ({ id: g.id, title: g.title })));

  // Verificar staff
  const staff = await prisma.staff.findMany({
    where: { businessId: business.id }
  });
  console.log(`\nStaff: ${staff.length}`, staff.map(s => ({ id: s.id, name: s.name })));

  // Verificar working hours
  const workingHours = await prisma.workingHours.findMany({
    where: { businessId: business.id }
  });
  console.log(`\nWorking Hours: ${workingHours.length}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });