const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // First find or create a tenant
    let tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'System Admin',
          subdomain: 'admin',
          email: 'admin@nexodash.com',
          phone: '1234567890',
          timezone: 'America/New_York',
          currency: 'USD',
          locale: 'en-US',
          isActive: true,
          settings: {}
        }
      });
    }

    console.log('Using tenant:', tenant.id);

    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@nexodash.com'
      }
    });

    if (existingAdmin) {
      console.log('Admin user already exists, updating...');
      const updatedUser = await prisma.user.update({
        where: {
          id: existingAdmin.id
        },
        data: {
          passwordHash: hashedPassword,
          isAdmin: true,
          isActive: true,
          name: 'System Administrator'
        }
      });
      console.log('Admin user updated:');
      console.log('ID:', updatedUser.id);
      console.log('Name:', updatedUser.name);
      console.log('Email:', updatedUser.email);
      console.log('Is Admin:', updatedUser.isAdmin);
    } else {
      // Create the admin user
      const adminUser = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: 'admin@nexodash.com',
          emailVerified: new Date(),
          passwordHash: hashedPassword,
          name: 'System Administrator',
          language: 'en',
          isActive: true,
          isAdmin: true,  // This is the important flag for admin access
          lastLoginAt: null
        }
      });

      console.log('Admin user created:');
      console.log('ID:', adminUser.id);
      console.log('Name:', adminUser.name);
      console.log('Email:', adminUser.email);
      console.log('Is Admin:', adminUser.isAdmin);
    }
    
    console.log('\n✅ Admin login credentials:');
    console.log('============================');
    console.log('URL: http://localhost:3000/admin/login');
    console.log('Email: admin@nexodash.com');
    console.log('Password: password123');
    console.log('============================\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();