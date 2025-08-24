const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetUserPassword() {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash('Manager1+', 10);
    
    // Update the user's password
    const user = await prisma.users.update({
      where: {
        email: 'walny.mc@gmail.com'
      },
      data: {
        passwordHash: hashedPassword
      }
    });
    
    console.log('Password updated for user:', user.email);
    
    // Check if user has any businesses
    const memberships = await prisma.memberships.findMany({
      where: {
        userId: user.id
      },
      include: {
        business: true
      }
    });
    
    if (memberships.length === 0) {
      console.log('User has no businesses. Creating a demo business...');
      
      // Create a tenant
      const tenant = await prisma.tenants.create({
        data: {
          name: 'Walny Business',
          slug: 'walny-business',
          plan: 'PRO',
          settings: {}
        }
      });
      
      // Create a business
      const business = await prisma.businesses.create({
        data: {
          tenantId: tenant.id,
          name: 'Walny Business',
          slug: 'walny-business',
          description: 'Your business description',
          phone: '1234567890',
          email: 'walny.mc@gmail.com',
          address: '123 Main St',
          city: 'Your City',
          state: 'YS',
          zipCode: '12345',
          country: 'US',
          timezone: 'America/New_York',
          currency: 'USD',
          settings: {
            bookingEnabled: true,
            requireApproval: false,
            autoConfirm: true
          },
          isActive: true
        }
      });
      
      // Create membership
      await prisma.memberships.create({
        data: {
          userId: user.id,
          businessId: business.id,
          role: 'OWNER'
        }
      });
      
      console.log('Business created:', business.name);
      console.log('User is now OWNER of the business');
    } else {
      console.log('User has businesses:', memberships.map(m => m.business.name).join(', '));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserPassword();