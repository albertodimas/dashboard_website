import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testClientPortal() {
  try {
    const customerId = 'be74e2a3-f52c-4efa-9920-c813cfb1b106'; // TTT customer ID
    
    console.log('🔍 Testing client portal data fetch for customer TTT...\n');
    
    // Test the exact same query as the API endpoint
    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId: customerId,
        status: {
          in: ['PENDING', 'ACTIVE', 'EXPIRED']
        }
      },
      include: {
        package: {
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        },
        business: {
          select: {
            name: true,
            slug: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📦 Packages found: ${packages.length}`);
    packages.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.package?.name} - ${p.status} - ${p.remainingSessions}/${p.totalSessions} sessions`);
    });
    
    // Test appointments query with the FIXED orderBy field
    const appointments = await prisma.appointment.findMany({
      where: {
        customerId: customerId
      },
      include: {
        service: true,
        staff: {
          select: {
            name: true
          }
        },
        business: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'  // This is now correct (was 'date' before)
      },
      take: 10
    });
    
    console.log(`\n📅 Appointments found: ${appointments.length}`);
    
    // Calculate stats
    const stats = {
      activePackages: packages.filter(p => p.status === 'ACTIVE').length,
      pendingPackages: packages.filter(p => p.status === 'PENDING').length,
      totalSessionsAvailable: packages
        .filter(p => p.status === 'ACTIVE')
        .reduce((acc, p) => acc + p.remainingSessions, 0),
      upcomingAppointments: appointments.filter(a => 
        new Date(a.startTime) > new Date() && a.status !== 'CANCELLED'
      ).length
    };
    
    console.log('\n📊 Stats:');
    console.log(`  Active Packages: ${stats.activePackages}`);
    console.log(`  Pending Packages: ${stats.pendingPackages}`);
    console.log(`  Total Sessions Available: ${stats.totalSessionsAvailable}`);
    console.log(`  Upcoming Appointments: ${stats.upcomingAppointments}`);
    
    console.log('\n✅ All queries executed successfully! The client portal should work now.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testClientPortal();