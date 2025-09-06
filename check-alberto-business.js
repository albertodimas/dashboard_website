const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkAlbertoBusiness() {
  try {
    // Check alberto's business
    const user = await prisma.user.findFirst({
      where: { email: 'albertodimasmorazaldivar@gmail.com' },
      select: { tenantId: true, name: true, avatar: true }
    });

    if (user) {
      console.log('User:', user.name);
      console.log('Has avatar:', !!user.avatar);
      
      const business = await prisma.business.findFirst({
        where: { tenantId: user.tenantId },
        select: { 
          id: true, 
          name: true, 
          slug: true, 
          customSlug: true, 
          enableStaffModule: true 
        }
      });

      if (business) {
        console.log('\nBusiness:', {
          name: business.name,
          slug: business.slug,
          customSlug: business.customSlug,
          enableStaffModule: business.enableStaffModule
        });
        
        console.log('\nURL to access: http://localhost:3001/' + (business.customSlug || business.slug));

        const staff = await prisma.staff.findMany({
          where: { businessId: business.id },
          select: { 
            id: true, 
            name: true, 
            specialties: true, 
            photo: true 
          }
        });

        console.log('\nStaff members:');
        staff.forEach(s => {
          console.log({
            name: s.name,
            specialties: s.specialties,
            specialtiesType: typeof s.specialties,
            specialtiesValue: Array.isArray(s.specialties) ? `Array(${s.specialties.length})` : s.specialties,
            hasPhoto: !!s.photo
          });
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAlbertoBusiness();