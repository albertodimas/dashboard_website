const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createBusinessOwner() {
  try {
    // First find or create a tenant
    let tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          subdomain: 'test',
          email: 'test@example.com',
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
    const hashedPassword = await bcrypt.hash('Manager1+**', 10);

    // Create the business owner user
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'owner@example.com',
        emailVerified: new Date(),
        passwordHash: hashedPassword,
        name: 'Business Owner',
        language: 'en',
        isActive: true,
        isAdmin: false,
        lastLoginAt: null
      }
    });

    console.log('Business owner created:');
    console.log('ID:', user.id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);

    // Create a business for this owner
    const business = await prisma.business.create({
      data: {
        tenantId: tenant.id,
        name: 'Test Business',
        slug: 'test-business',
        customSlug: 'testbiz',
        email: 'business@example.com',
        phone: '1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        timezone: 'America/New_York',
        currency: 'USD',
        isActive: true,
        isPremium: false,
        isBlocked: false,
        enableStaffModule: true,
        enablePackagesModule: true
      }
    });

    console.log('Business created:', business.name);

    // Create membership linking user to business
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        businessId: business.id,
        role: 'OWNER'
      }
    });

    console.log('Membership created - User is now owner of the business');
    
    console.log('\nLogin credentials for business owner:');
    console.log('URL: http://localhost:3000/login');
    console.log('Email: owner@example.com');
    console.log('Password: Manager1+**');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBusinessOwner();