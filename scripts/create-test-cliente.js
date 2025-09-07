const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestCliente() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create or update test cliente
    const cliente = await prisma.customer.upsert({
      where: { email: 'cliente@test.com' },
      update: {
        name: 'Cliente Test',
        password: hashedPassword,
        phone: '1234567890'
      },
      create: {
        email: 'cliente@test.com',
        name: 'Cliente Test',
        password: hashedPassword,
        phone: '1234567890'
      }
    });
    
    console.log('✅ Cliente de prueba creado/actualizado:', cliente);
    
    // Verificar si hay negocios para asociar
    const businesses = await prisma.business.findMany({
      take: 2
    });
    
    if (businesses.length > 0) {
      // Asociar cliente con negocios
      for (const business of businesses) {
        await prisma.businessCustomer.upsert({
          where: {
            businessId_customerId: {
              businessId: business.id,
              customerId: cliente.id
            }
          },
          update: {},
          create: {
            businessId: business.id,
            customerId: cliente.id
          }
        });
        console.log(`✅ Cliente asociado con negocio: ${business.name}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCliente();