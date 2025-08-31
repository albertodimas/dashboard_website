const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar el usuario
    const user = await prisma.user.findFirst({
      where: {
        email: 'walny.mc@gmail.com'
      }
    });
    
    if (user) {
      console.log('✅ Usuario encontrado:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Nombre:', user.name);
      console.log('Activo:', user.isActive);
      console.log('Admin:', user.isAdmin);
      console.log('Tenant ID:', user.tenantId);
      console.log('Email verificado:', user.emailVerified);
      
      // Verificar la contraseña
      const passwordCorrect = await bcrypt.compare('Manager1+', user.passwordHash);
      console.log('\n🔐 Contraseña "Manager1+" es correcta?:', passwordCorrect);
      
      if (!passwordCorrect) {
        console.log('\n⚠️  La contraseña no coincide. Actualizando...');
        const newHash = await bcrypt.hash('Manager1+', 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash }
        });
        console.log('✅ Contraseña actualizada correctamente');
      }
    } else {
      console.log('❌ Usuario NO encontrado. Creando nuevo usuario...');
      
      // Crear el usuario si no existe
      const hashedPassword = await bcrypt.hash('Manager1+', 10);
      
      // Primero verificar si existe un tenant o crear uno
      let tenant = await prisma.tenant.findFirst();
      
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: 'Default Business',
            subdomain: 'default',
            email: 'business@default.com',
            phone: '+1234567890',
            isActive: true,
          }
        });
        console.log('✅ Tenant creado:', tenant.id);
      }
      
      const newUser = await prisma.user.create({
        data: {
          email: 'walny.mc@gmail.com',
          passwordHash: hashedPassword,
          name: 'Walny',
          emailVerified: new Date(),
          isActive: true,
          isAdmin: true,
          tenantId: tenant.id
        },
      });
      
      console.log('✅ Usuario creado exitosamente:');
      console.log('Email:', newUser.email);
      console.log('ID:', newUser.id);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();