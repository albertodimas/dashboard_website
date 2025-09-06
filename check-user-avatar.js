const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserAvatar() {
  try {
    // Buscar el usuario por email
    const user = await prisma.user.findFirst({
      where: {
        email: 'albertodimasmorazaldivar@gmail.com'
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        tenantId: true
      }
    });

    if (user) {
      console.log('Usuario encontrado:', {
        id: user.id,
        name: user.name,
        email: user.email,
        hasAvatar: !!user.avatar,
        avatarLength: user.avatar ? user.avatar.length : 0,
        tenantId: user.tenantId
      });

      // Buscar el negocio asociado
      const business = await prisma.business.findFirst({
        where: {
          tenantId: user.tenantId
        },
        select: {
          id: true,
          name: true,
          customSlug: true,
          logo: true,
          enableStaffModule: true
        }
      });

      if (business) {
        console.log('\nNegocio encontrado:', {
          id: business.id,
          name: business.name,
          customSlug: business.customSlug,
          hasLogo: !!business.logo,
          enableStaffModule: business.enableStaffModule
        });

        // Buscar staff asociado
        const staff = await prisma.staff.findMany({
          where: {
            businessId: business.id
          },
          select: {
            id: true,
            name: true,
            photo: true
          }
        });

        console.log('\nStaff encontrado:', staff.length > 0 ? staff : 'No hay staff');
      }
    } else {
      console.log('Usuario no encontrado');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAvatar();