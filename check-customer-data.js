const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCustomerData() {
  try {
    // Find customer by email
    const customer = await prisma.customer.findFirst({
      where: {
        email: 'walny.mc@gmail.com'
      },
      include: {
        packagePurchases: {
          include: {
            package: true,
            business: true
          }
        }
      }
    });

    if (!customer) {
      console.log('❌ No customer found with email: walny.mc@gmail.com');
      
      // Check if it's a typo - let's see all customers
      const allCustomers = await prisma.customer.findMany({
        select: {
          email: true,
          name: true,
          _count: {
            select: {
              packagePurchases: true
            }
          }
        }
      });
      
      console.log('\n📧 All customers in database:');
      allCustomers.forEach(c => {
        console.log(`  - ${c.email} (${c.name}) - ${c._count.packagePurchases} purchases`);
      });
    } else {
      console.log('✅ Customer found:');
      console.log(`  ID: ${customer.id}`);
      console.log(`  Name: ${customer.name}`);
      console.log(`  Email: ${customer.email}`);
      console.log(`  Tenant ID: ${customer.tenantId}`);
      console.log(`\n📦 Package Purchases: ${customer.packagePurchases.length}`);
      
      customer.packagePurchases.forEach((pp, index) => {
        console.log(`\n  Purchase #${index + 1}:`);
        console.log(`    - Package: ${pp.package?.name || 'N/A'}`);
        console.log(`    - Business: ${pp.business?.name || 'N/A'}`);
        console.log(`    - Status: ${pp.status}`);
        console.log(`    - Sessions: ${pp.remainingSessions}/${pp.totalSessions}`);
        console.log(`    - Purchase Date: ${pp.purchaseDate}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomerData();