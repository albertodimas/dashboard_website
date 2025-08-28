import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deleteDuplicateCustomer() {
  try {
    console.log('🔍 Finding duplicate customers with email walny.mc@gmail.com...\n');
    
    // Find all customers with this email
    const customers = await prisma.customer.findMany({
      where: {
        email: 'walny.mc@gmail.com'
      },
      include: {
        packagePurchases: true,
        appointments: true
      }
    });
    
    console.log(`Found ${customers.length} customers with email walny.mc@gmail.com:\n`);
    
    customers.forEach((c, index) => {
      console.log(`Customer #${index + 1}:`);
      console.log(`  ID: ${c.id}`);
      console.log(`  Name: ${c.name}`);
      console.log(`  Packages: ${c.packagePurchases.length}`);
      console.log(`  Appointments: ${c.appointments.length}`);
      console.log('');
    });
    
    // Find the customer WITHOUT packages (the one to delete)
    const customerToDelete = customers.find(c => 
      c.packagePurchases.length === 0 && c.appointments.length === 0
    );
    
    if (customerToDelete) {
      console.log(`\n❌ Deleting customer "${customerToDelete.name}" (ID: ${customerToDelete.id}) with no packages or appointments...`);
      
      await prisma.customer.delete({
        where: {
          id: customerToDelete.id
        }
      });
      
      console.log('✅ Customer deleted successfully!\n');
      
      // Verify the remaining customer
      const remainingCustomer = await prisma.customer.findFirst({
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
      
      if (remainingCustomer) {
        console.log('✅ Remaining customer:');
        console.log(`  Name: ${remainingCustomer.name}`);
        console.log(`  ID: ${remainingCustomer.id}`);
        console.log(`  Email: ${remainingCustomer.email}`);
        console.log(`  Total Packages: ${remainingCustomer.packagePurchases.length}`);
        
        if (remainingCustomer.packagePurchases.length > 0) {
          console.log('\n📦 Package details:');
          remainingCustomer.packagePurchases.forEach((pp, index) => {
            console.log(`  ${index + 1}. ${pp.package?.name} (${pp.status}) - ${pp.remainingSessions}/${pp.totalSessions} sessions`);
          });
        }
      }
    } else {
      console.log('⚠️ No customer found without packages to delete.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDuplicateCustomer();