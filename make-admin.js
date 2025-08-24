const { PrismaClient } = require('./apps/web/node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://dashboard:dashboard@localhost:5432/dashboard?schema=public'
    }
  }
});

async function makeAdmin() {
  try {
    const email = 'walny.mc@gmail.com';
    
    // First find the user
    const userToUpdate = await prisma.user.findFirst({
      where: {
        email: email
      }
    });
    
    if (!userToUpdate) {
      console.error('User not found:', email);
      return;
    }
    
    // Update user to be admin
    const user = await prisma.user.update({
      where: {
        id: userToUpdate.id
      },
      data: {
        isAdmin: true
      }
    });
    
    console.log(`User ${user.email} is now an admin`);
    console.log('You can now login to admin panel at /admin/login with your regular credentials');
    
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();