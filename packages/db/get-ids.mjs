import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.findFirst({
    where: { slug: 'coffeeshop' },
    include: { services: { take: 1 } }
  });
  
  console.log('Business ID:', business.id);
  console.log('First Service ID:', business.services[0]?.id);
  console.log('Today:', new Date().toISOString().split('T')[0]);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });