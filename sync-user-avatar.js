const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncUserAvatar() {
  try {
    // Buscar el usuario
    const user = await prisma.user.findFirst({
      where: {
        email: 'albertodimasmorazaldivar@gmail.com'
      }
    });

    if (!user) {
      console.log('Usuario no encontrado');
      return;
    }

    console.log('Usuario encontrado:', user.name);
    console.log('Tiene avatar:', !!user.avatar);

    // Buscar el negocio
    const business = await prisma.business.findFirst({
      where: {
        tenantId: user.tenantId
      }
    });

    if (!business) {
      console.log('Negocio no encontrado');
      return;
    }

    console.log('Negocio encontrado:', business.name);

    // Actualizar el staff con el avatar del usuario
    const updatedStaff = await prisma.staff.updateMany({
      where: {
        businessId: business.id,
        name: user.name
      },
      data: {
        photo: user.avatar
      }
    });

    console.log('Staff actualizado:', updatedStaff.count, 'registros');

    // Verificar
    const staff = await prisma.staff.findFirst({
      where: {
        businessId: business.id,
        name: user.name
      },
      select: {
        id: true,
        name: true,
        photo: true
      }
    });

    console.log('\nEstado final del staff:');
    console.log('- ID:', staff.id);
    console.log('- Nombre:', staff.name);
    console.log('- Tiene foto:', !!staff.photo);
    if (staff.photo) {
      console.log('- Tamaño de foto:', staff.photo.length, 'bytes');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncUserAvatar();