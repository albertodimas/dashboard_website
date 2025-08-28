import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get business
  const business = await prisma.business.findFirst({
    where: { slug: 'coffeeshop' }
  });
  
  if (!business) {
    console.error('Business not found');
    return;
  }
  
  // Add staff members
  const staff1 = await prisma.staff.create({
    data: {
      businessId: business.id,
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '123456789',
      isActive: true,
      canAcceptBookings: true,
      specialties: ['Cortes', 'Peinados']
    }
  });
  
  const staff2 = await prisma.staff.create({
    data: {
      businessId: business.id,
      name: 'María González',
      email: 'maria@example.com',
      phone: '987654321',
      isActive: true,
      canAcceptBookings: true,
      specialties: ['Peinados', 'Color']
    }
  });
  
  console.log('Staff created:', staff1.name, staff2.name);
  
  // Add working hours for business (general)
  const days = [1, 2, 3, 4, 5]; // Monday to Friday
  for (const day of days) {
    await prisma.workingHour.create({
      data: {
        businessId: business.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true
      }
    });
  }
  
  // Add specific working hours for staff1 (different schedule)
  for (const day of [1, 2, 3, 4, 5]) {
    await prisma.workingHour.create({
      data: {
        businessId: business.id,
        staffId: staff1.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '16:00',
        isActive: true
      }
    });
  }
  
  // Add specific working hours for staff2 (part-time)
  for (const day of [2, 3, 4]) { // Tuesday, Wednesday, Thursday only
    await prisma.workingHour.create({
      data: {
        businessId: business.id,
        staffId: staff2.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '18:00',
        isActive: true
      }
    });
  }
  
  console.log('Working hours created');
  
  // Get a customer for reviews
  const customer = await prisma.customer.findFirst({
    where: { email: 'walny.mc@gmail.com' }
  });
  
  if (customer) {
    // Add some reviews
    await prisma.review.create({
      data: {
        tenantId: business.tenantId,
        businessId: business.id,
        customerId: customer.id,
        rating: 5,
        comment: 'Excelente servicio, muy profesional y puntual. Definitivamente volveré!',
        isPublished: true,
        publishedAt: new Date()
      }
    });
    
    await prisma.review.create({
      data: {
        tenantId: business.tenantId,
        businessId: business.id,
        customerId: customer.id,
        rating: 4,
        comment: 'Buen trabajo, aunque tuve que esperar un poco. El resultado fue muy bueno.',
        isPublished: true,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    });
    
    await prisma.review.create({
      data: {
        tenantId: business.tenantId,
        businessId: business.id,
        customerId: customer.id,
        rating: 5,
        comment: 'Increíble atención al detalle. El mejor corte que he tenido!',
        isPublished: true,
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    });
    
    console.log('Reviews created');
  }
  
  console.log('✅ All data seeded successfully!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });