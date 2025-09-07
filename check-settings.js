const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');

async function checkSettings() {
  const prisma = new PrismaClient();
  
  try {
    const business = await prisma.business.findFirst({
      where: {
        name: 'wmcFit'
      },
      select: {
        id: true,
        name: true,
        settings: true,
        enableStaffModule: true
      }
    });
    
    console.log('wmcFit business settings:', JSON.stringify(business, null, 2));
    
    // Check if there are working hours
    if (business) {
      const workingHours = await prisma.workingHour.findMany({
        where: {
          businessId: business.id
        }
      });
      
      console.log('\nWorking hours:', JSON.stringify(workingHours, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();