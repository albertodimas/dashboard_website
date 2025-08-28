const { PrismaClient } = require('@prisma/client');
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
  console.log('Businesses:', JSON.stringify(businesses, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });