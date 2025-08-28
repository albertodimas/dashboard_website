import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.business.findMany({ 
    select: { 
      name: true, 
      slug: true, 
      customSlug: true,
      isActive: true 
    }
  });
  console.log('Businesses:');
  businesses.forEach(b => {
    console.log(`- ${b.name}: slug="${b.slug}", customSlug="${b.customSlug || 'not set'}", active=${b.isActive}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });