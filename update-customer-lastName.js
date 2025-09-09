const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function updateCustomer() {
  try {
    const customer = await prisma.customer.update({
      where: {
        id: '6cf37f70-056b-4fee-a359-ffd4f484de39'
      },
      data: {
        lastName: 'Martinez'
      }
    });

    console.log('Customer updated:');
    console.log('Name:', customer.name);
    console.log('LastName:', customer.lastName);
    console.log('Email:', customer.email);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCustomer();