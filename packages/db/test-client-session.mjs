import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testClientSession() {
  try {
    // El ID correcto del cliente TTT que tiene los paquetes
    const correctCustomerId = 'be74e2a3-f52c-4efa-9920-c813cfb1b106';
    
    console.log('🔍 Testing with correct customer ID:', correctCustomerId);
    
    // Get packages for this customer
    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId: correctCustomerId,
        status: {
          in: ['PENDING', 'ACTIVE', 'EXPIRED']
        }
      },
      include: {
        package: true,
        business: true
      }
    });
    
    console.log(`\n📦 Packages found: ${packages.length}`);
    packages.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.package?.name} - ${p.status} - ${p.remainingSessions}/${p.totalSessions} sessions`);
    });
    
    // Check customer details
    const customer = await prisma.customer.findUnique({
      where: { id: correctCustomerId }
    });
    
    console.log('\n👤 Customer details:');
    console.log(`  Name: ${customer?.name}`);
    console.log(`  Email: ${customer?.email}`);
    console.log(`  ID: ${customer?.id}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testClientSession();