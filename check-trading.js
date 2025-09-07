const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');

async function checkTrading() {
  const prisma = new PrismaClient();
  
  try {
    const business = await prisma.business.findFirst({
      where: {
        name: 'Trading'
      },
      select: {
        id: true,
        name: true,
        slug: true,
        customSlug: true
      }
    });
    
    console.log('Trading business:', JSON.stringify(business, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

checkTrading();