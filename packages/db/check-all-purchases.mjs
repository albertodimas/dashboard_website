import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAllPurchases() {
  try {
    console.log('📦 Checking ALL package purchases in the database...\n');
    
    // Get all purchases with customer info
    const allPurchases = await prisma.packagePurchase.findMany({
      include: {
        customer: true,
        package: true,
        business: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total purchases found: ${allPurchases.length}\n`);
    
    if (allPurchases.length > 0) {
      console.log('Recent purchases:');
      allPurchases.forEach((purchase, index) => {
        console.log(`\n#${index + 1} Purchase:`);
        console.log(`  ID: ${purchase.id}`);
        console.log(`  Customer: ${purchase.customer?.name} (${purchase.customer?.email})`);
        console.log(`  Customer ID: ${purchase.customerId}`);
        console.log(`  Package: ${purchase.package?.name}`);
        console.log(`  Business: ${purchase.business?.name}`);
        console.log(`  Status: ${purchase.status}`);
        console.log(`  Payment Status: ${purchase.paymentStatus}`);
        console.log(`  Sessions: ${purchase.remainingSessions}/${purchase.totalSessions}`);
        console.log(`  Price: $${purchase.pricePaid}`);
        console.log(`  Created: ${purchase.createdAt}`);
      });
    }
    
    // Check specifically for walny.mc@gmail.com
    console.log('\n\n🔍 Searching for walny.mc@gmail.com customer ID...');
    const walnyCustomer = await prisma.customer.findFirst({
      where: {
        email: 'walny.mc@gmail.com'
      }
    });
    
    if (walnyCustomer) {
      console.log(`Found customer: ${walnyCustomer.name} with ID: ${walnyCustomer.id}`);
      
      // Check if there are purchases with different email
      const purchasesForWalny = allPurchases.filter(p => 
        p.customerId === walnyCustomer.id || 
        p.customer?.email === 'walny.mc@gmail.com'
      );
      
      console.log(`\nPurchases for walny.mc@gmail.com: ${purchasesForWalny.length}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllPurchases();