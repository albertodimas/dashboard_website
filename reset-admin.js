const { PrismaClient } = require('./apps/web/node_modules/@prisma/client');
const bcrypt = require('./apps/web/node_modules/bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://dashboard:dashboard@localhost:5432/dashboard?schema=public'
    }
  }
});

async function resetAdmin() {
  try {
    const adminPassword = 'Admin123!';
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Update admin password
    const admin = await prisma.user.update({
      where: {
        id: '6a699996-be14-455c-a0c8-d59fb64cb941'
      },
      data: {
        passwordHash: passwordHash
      }
    });
    
    console.log('Admin password reset successfully!');
    console.log('Email: admin@dashboard.com');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();