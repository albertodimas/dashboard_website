const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkServiceStaff() {
  try {
    console.log('🔍 Verificando relaciones servicio-trabajador...\n');
    
    // Obtener todos los servicios
    const services = await prisma.service.findMany({
      include: {
        serviceStaff: {
          include: {
            staff: true
          }
        }
      }
    });
    
    console.log('📋 Servicios y sus trabajadores asignados:\n');
    services.forEach(service => {
      console.log(`\n📌 Servicio: ${service.name} (ID: ${service.id})`);
      if (service.serviceStaff && service.serviceStaff.length > 0) {
        console.log('   Trabajadores asignados:');
        service.serviceStaff.forEach(ss => {
          console.log(`   - ${ss.staff.name} (ID: ${ss.staffId})`);
        });
      } else {
        console.log('   ❌ Sin trabajadores asignados');
      }
    });
    
    // Verificar la tabla service_staff directamente
    console.log('\n\n📊 Tabla service_staff (relaciones directas):');
    const serviceStaff = await prisma.serviceStaff.findMany({
      include: {
        service: true,
        staff: true
      }
    });
    
    serviceStaff.forEach(ss => {
      console.log(`   Servicio: ${ss.service.name} -> Trabajador: ${ss.staff.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkServiceStaff();