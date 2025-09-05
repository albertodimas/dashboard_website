const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreSlug() {
  try {
    // Restore the original customSlug
    const business = await prisma.business.findFirst({
      where: {
        customSlug: 'welcome-trade'
      }
    });
    
    if (business) {
      console.log('Found business:', business.name);
      
      // Update back to original slug with slash
      const updated = await prisma.business.update({
        where: { id: business.id },
        data: {
          customSlug: 'trade/welcome'
        }
      });
      
      console.log('Restored customSlug to:', updated.customSlug);
      console.log('Business can now be accessed at: http://localhost:3005/trade/welcome');
    } else {
      console.log('Business not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreSlug();