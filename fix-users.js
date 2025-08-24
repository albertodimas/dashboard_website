const { PrismaClient } = require('./apps/web/node_modules/@prisma/client');
const bcrypt = require('./apps/web/node_modules/bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://dashboard:dashboard@localhost:5432/dashboard?schema=public'
    }
  }
});

async function fixUsers() {
  try {
    // 1. Remove admin privileges from walny.mc@gmail.com
    const user = await prisma.user.findFirst({
      where: { email: 'walny.mc@gmail.com' }
    });
    
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: false }
      });
      console.log('Removed admin privileges from walny.mc@gmail.com');
    }
    
    // 2. Create a separate admin user
    const adminEmail = 'admin@dashboard.com';
    const adminPassword = 'Admin123!';
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: adminEmail }
    });
    
    if (!existingAdmin) {
      // Get the first tenant for admin
      const tenant = await prisma.tenant.findFirst();
      
      if (tenant) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        
        const newAdmin = await prisma.user.create({
          data: {
            email: adminEmail,
            name: 'Admin',
            passwordHash: passwordHash,
            isAdmin: true,
            tenantId: tenant.id,
            language: 'en'
          }
        });
        
        console.log('Created admin user:');
        console.log('Email: admin@dashboard.com');
        console.log('Password: Admin123!');
      }
    } else {
      // Update existing admin
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { isAdmin: true }
      });
      console.log('Admin user already exists: admin@dashboard.com');
    }
    
    // 3. Verify regular user can login
    console.log('\nRegular user credentials:');
    console.log('Email: walny.mc@gmail.com');
    console.log('Password: Manager1+');
    console.log('URL: http://localhost:3000/login');
    
    console.log('\nAdmin panel credentials:');
    console.log('Email: admin@dashboard.com');
    console.log('Password: Admin123!');
    console.log('URL: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('Error fixing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsers();