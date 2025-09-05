const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCustomSlug() {
  try {
    // Find business with problematic customSlug
    const business = await prisma.business.findFirst({
      where: {
        customSlug: 'trade/welcome'
      }
    });
    
    if (business) {
      console.log('Found business with problematic customSlug:', business.name);
      
      // Update to use a valid slug without slashes
      const updated = await prisma.business.update({
        where: { id: business.id },
        data: {
          customSlug: 'welcome-trade' // Changed to a valid slug format
        }
      });
      
      console.log('Updated customSlug to:', updated.customSlug);
      console.log('Business can now be accessed at: http://localhost:3005/b/welcome-trade');
    } else {
      console.log('No business found with customSlug "trade/welcome"');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCustomSlug();