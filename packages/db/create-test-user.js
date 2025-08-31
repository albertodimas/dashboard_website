const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create a test user with a tenant
    const user = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash: hashedPassword,
        name: 'Admin User',
        emailVerified: new Date(),
        isActive: true,
        isAdmin: true,
        tenant: {
          create: {
            name: 'Test Business',
            subdomain: 'test-business',
            email: 'business@test.com',
            phone: '+1234567890',
            isActive: true,
          }
        }
      },
    });
    
    console.log('✅ Usuario de prueba creado:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');
    console.log('User ID:', user.id);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();