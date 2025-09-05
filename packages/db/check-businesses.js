const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBusinesses() {
  try {
    const businesses = await prisma.business.findMany({
      select: {
        name: true,
        slug: true,
        customSlug: true,
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('Recent businesses:');
    console.log(JSON.stringify(businesses, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinesses();