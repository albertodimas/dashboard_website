const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function fixAlbertoSpecialties() {
  try {
    // Check alberto's business
    const user = await prisma.user.findFirst({
      where: { email: 'albertodimasmorazaldivar@gmail.com' },
      select: { tenantId: true, name: true }
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
        console.log('\nBusiness:', business.name);
        console.log('Slug:', business.slug || business.customSlug);
        console.log('Staff module enabled:', business.enableStaffModule);

        // Find all staff for this business
        const allStaff = await prisma.staff.findMany({
          where: { businessId: business.id },
          select: { 
            id: true, 
            name: true, 
            specialties: true
          }
        });

        console.log('\nStaff found:', allStaff.length);
        allStaff.forEach(s => {
          console.log({
            id: s.id,
            name: s.name,
            specialties: s.specialties,
            specialtiesType: typeof s.specialties,
            isArray: Array.isArray(s.specialties),
            arrayLength: Array.isArray(s.specialties) ? s.specialties.length : 'N/A'
          });
        });

        // Fix any staff with empty array or problematic specialties
        const updateResult = await prisma.staff.updateMany({
          where: {
            businessId: business.id,
            OR: [
              { specialties: { equals: [] } },
              { specialties: { equals: [''] } },
              { specialties: { equals: ['0'] } }
            ]
          },
          data: {
            specialties: []
          }
        });

        console.log(`\nUpdated ${updateResult.count} staff records`);

        // Also check if specialties needs to be set to null for proper handling
        const deleteSpecialties = await prisma.staff.updateMany({
          where: {
            businessId: business.id,
            name: user.name
          },
          data: {
            specialties: []
          }
        });

        console.log(`Set specialties to empty array for ${deleteSpecialties.count} records`);

        // Verify the final state
        const finalStaff = await prisma.staff.findFirst({
          where: {
            businessId: business.id,
            name: user.name
          },
          select: {
            id: true,
            name: true,
            specialties: true
          }
        });

        console.log('\nFinal staff state:', finalStaff);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAlbertoSpecialties();