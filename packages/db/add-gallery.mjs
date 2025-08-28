import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.findFirst({
    where: { slug: 'coffeeshop' }
  });
  
  if (!business) {
    console.error('Business not found');
    return;
  }
  
  // Add gallery items
  const galleryItems = await prisma.galleryItem.createMany({
    data: [
      {
        businessId: business.id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800',
        title: 'Corte Moderno',
        description: 'Estilo contemporáneo',
        category: 'Cortes',
        order: 1,
        isActive: true
      },
      {
        businessId: business.id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1599351431613-18ef1fdd27e3?w=800',
        title: 'Barbería Clásica',
        description: 'Ambiente tradicional',
        category: 'Ambiente',
        order: 2,
        isActive: true
      },
      {
        businessId: business.id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800',
        title: 'Peinado Elegante',
        description: 'Para ocasiones especiales',
        category: 'Peinados',
        order: 3,
        isActive: true
      },
      {
        businessId: business.id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',
        title: 'Trabajo de Precisión',
        description: 'Atención al detalle',
        category: 'Cortes',
        order: 4,
        isActive: true
      }
    ]
  });
  
  console.log('Gallery items added:', galleryItems.count);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });