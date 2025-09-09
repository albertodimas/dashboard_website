const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCustomer() {
  try {
    // First create a tenant
    const tenant = await prisma.tenant.create({
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

    console.log('Tenant created:', tenant.id);

    // Hash the password
    const hashedPassword = await bcrypt.hash('Manager1+**', 10);

    // Create the customer without lastName first
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: 'walny.mc@gmail.com',
        name: 'Walny',
        phone: '099400230',
        password: hashedPassword,
        emailVerified: true,
        source: 'DIRECT'
      }
    });

    console.log('Customer created:');
    console.log('ID:', customer.id);
    console.log('Name:', customer.name);
    console.log('LastName:', customer.lastName);
    console.log('Email:', customer.email);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCustomer();