const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkSpecialties() {
  try {
    // Check walny.mc@gmail.com business
    const user = await prisma.user.findFirst({
      where: { email: 'walny.mc@gmail.com' },
      select: { tenantId: true, name: true, avatar: true }
    });

    if (user) {
      console.log('User:', user.name);
      
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
            hasPhoto: !!s.photo
          });
        });

        // Update staff with empty specialties array
        const updateResult = await prisma.staff.updateMany({
          where: {
            businessId: business.id,
            specialties: {
              equals: []
            }
          },
          data: {
            specialties: []
          }
        });

        console.log(`\nUpdated ${updateResult.count} staff members with '0' specialties to null`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecialties();