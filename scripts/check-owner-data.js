const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Buscar el negocio "trade"
  const business = await prisma.business.findFirst({
    where: {
      customSlug: 'trade'
    },
    include: {
      tenant: {
        include: {
          users: true
        }
      }
    }
  });

  if (!business) {
    console.log('No se encontró el negocio trade');
    return;
  }

  console.log('=== NEGOCIO TRADE ===');
  console.log('Nombre:', business.name);
  console.log('TenantId:', business.tenantId);
  console.log('EnableStaffModule:', business.enableStaffModule);
  
  if (business.tenant) {
    console.log('\n=== TENANT ===');
    console.log('Tenant ID:', business.tenant.id);
    console.log('Tenant Name:', business.tenant.name);
    
    if (business.tenant.users && business.tenant.users.length > 0) {
      console.log('\n=== USUARIOS DEL TENANT ===');
      business.tenant.users.forEach((user, index) => {
        console.log(`\nUsuario ${index + 1}:`);
        console.log('- ID:', user.id);
        console.log('- Nombre:', user.name);
        console.log('- Email:', user.email);
        console.log('- IsAdmin:', user.isAdmin);
        console.log('- Avatar:', user.avatar ? 'Sí tiene' : 'No tiene');
      });
    } else {
      console.log('\n❌ NO HAY USUARIOS EN ESTE TENANT');
    }
  } else {
    console.log('\n❌ NO HAY TENANT ASOCIADO');
  }
  
  // También buscar staff del negocio
  const staff = await prisma.staff.findMany({
    where: {
      businessId: business.id
    }
  });
  
  console.log('\n=== STAFF ===');
  if (staff.length > 0) {
    staff.forEach((s, index) => {
      console.log(`\nStaff ${index + 1}:`);
      console.log('- Nombre:', s.name);
      console.log('- Email:', s.email);
      console.log('- IsActive:', s.isActive);
    });
  } else {
    console.log('No hay staff registrado');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());