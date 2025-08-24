const bcrypt = require('./apps/web/node_modules/bcryptjs');
const { PrismaClient } = require('./apps/web/node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://dashboard:dashboard@localhost:5432/dashboard?schema=public'
    }
  }
});

async function updatePassword() {
  try {
    const email = 'walny.mc@gmail.com';
    const newPassword = 'Manager1+';
    
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
    
    // Hash the password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    const user = await prisma.user.update({
      where: {
        id: userToUpdate.id
      },
      data: {
        passwordHash: passwordHash
      }
    });
    
    console.log('Password updated successfully for:', user.email);
    
    // Also check/create membership with OWNER role
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id
      }
    });
    
    if (!membership) {
      // Get the business for this user
      const business = await prisma.business.findFirst({
        where: {
          tenantId: user.tenantId
        }
      });
      
      if (business) {
        await prisma.membership.create({
          data: {
            userId: user.id,
            businessId: business.id,
            role: 'OWNER'
          }
        });
        console.log('Created OWNER membership for user');
      }
    } else if (!membership.role || membership.role === '') {
      await prisma.membership.update({
        where: {
          id: membership.id
        },
        data: {
          role: 'OWNER'
        }
      });
      console.log('Updated membership role to OWNER');
    }
    
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();