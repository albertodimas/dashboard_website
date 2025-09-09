const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function checkCustomer() {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        email: 'walny.mc@gmail.com'
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        password: true
      }
    });

    if (customer) {
      console.log('Customer found:');
      console.log('ID:', customer.id);
      console.log('Name:', customer.name);
      console.log('LastName:', customer.lastName);
      console.log('Email:', customer.email);
      console.log('Has password:', !!customer.password);
    } else {
      console.log('Customer not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomer();