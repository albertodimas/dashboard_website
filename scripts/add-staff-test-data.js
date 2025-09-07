const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Buscar el negocio - primero listar todos para ver qué hay
  const allBusinesses = await prisma.business.findMany();
  console.log('Negocios disponibles:');
  allBusinesses.forEach(b => {
    console.log(`- ${b.name}: slug="${b.slug}", customSlug="${b.customSlug}"`);
  });

  // Buscar el negocio - usar Luxury Cuts Barbershop
  const business = await prisma.business.findFirst({
    where: {
      OR: [
        { slug: 'luxurycuts' },
        { name: 'Luxury Cuts Barbershop' }
      ]
    }
  });

  if (!business) {
    console.log('No se encontró el negocio');
    return;
  }

  console.log('Negocio encontrado:', business.name);
  console.log('enableStaffModule:', business.enableStaffModule);

  // Habilitar el módulo de staff si no está habilitado
  if (!business.enableStaffModule) {
    await prisma.business.update({
      where: { id: business.id },
      data: { enableStaffModule: true }
    });
    console.log('Módulo de staff habilitado');
  }

  // Buscar staff existente
  const existingStaff = await prisma.staff.findMany({
    where: { businessId: business.id }
  });

  console.log('Staff existente:', existingStaff.length, 'profesionales');

  // Actualizar el staff existente si no tiene especialidades o tiene '0'
  for (const staff of existingStaff) {
    if (!staff.specialties || staff.specialties.length === 0 || 
        (staff.specialties.length === 1 && (staff.specialties[0] === '0' || staff.specialties[0] === ''))) {
      await prisma.staff.update({
        where: { id: staff.id },
        data: { 
          specialties: ['Cortes clásicos', 'Afeitado tradicional'],
          bio: 'Más de 10 años de experiencia en barbería tradicional',
          rating: 4.8,
          totalReviews: 45
        }
      });
      console.log(`Actualizado ${staff.name} con especialidades`);
    }
  }

  if (existingStaff.length < 3) {
    // Crear algunos profesionales de prueba
    const staffData = [
      {
        businessId: business.id,
        name: 'Carlos Martínez',
        email: 'carlos@barbershop.com',
        phone: '555-0101',
        specialties: ['Cortes clásicos', 'Afeitado tradicional'],
        bio: 'Más de 10 años de experiencia en barbería tradicional',
        isActive: true,
        canAcceptBookings: true,
        rating: 4.8,
        totalReviews: 45,
        displayOrder: 1
      },
      {
        businessId: business.id,
        name: 'Roberto Silva',
        email: 'roberto@barbershop.com',
        phone: '555-0102',
        specialties: ['Diseños modernos', 'Coloración'],
        bio: 'Especialista en estilos modernos y tendencias actuales',
        isActive: true,
        canAcceptBookings: true,
        rating: 4.9,
        totalReviews: 62,
        displayOrder: 2
      },
      {
        businessId: business.id,
        name: 'Miguel Ángel',
        email: 'miguel@barbershop.com',
        phone: '555-0103',
        specialties: ['Barbas y bigotes', 'Tratamientos capilares'],
        bio: 'Experto en cuidado de barbas y tratamientos especializados',
        isActive: true,
        canAcceptBookings: true,
        rating: 4.7,
        totalReviews: 38,
        displayOrder: 3
      }
    ];

    for (const staff of staffData) {
      await prisma.staff.create({ data: staff });
      console.log('Creado profesional:', staff.name);
    }

    console.log(`Se crearon ${3 - existingStaff.length} profesionales de prueba`);
  }

  // Verificar el resultado final
  const finalStaff = await prisma.staff.findMany({
    where: { businessId: business.id }
  });

  console.log('\n--- Staff Final ---');
  finalStaff.forEach(s => {
    const specs = Array.isArray(s.specialties) ? s.specialties.join(', ') : 'Sin especialidades';
    console.log(`${s.name}: ${specs}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());