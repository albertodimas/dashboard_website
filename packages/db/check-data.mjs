import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get business
  const business = await prisma.business.findFirst({
    where: { slug: 'coffeeshop' },
    include: {
      reviews: true,
      workingHours: true,
      staff: true,
      services: true
    }
  });
  
  console.log('\n=== Business Data ===');
  console.log('Name:', business.name);
  console.log('Settings:', JSON.stringify(business.settings, null, 2));
  
  console.log('\n=== Reviews ===');
  console.log('Total reviews:', business.reviews.length);
  business.reviews.forEach(r => {
    console.log(`- Rating: ${r.rating}, Published: ${r.isPublished}, Comment: "${r.comment}"`);
  });
  
  console.log('\n=== Working Hours ===');
  console.log('Total working hours:', business.workingHours.length);
  business.workingHours.forEach(wh => {
    console.log(`- Day ${wh.dayOfWeek}: ${wh.startTime} - ${wh.endTime}, Active: ${wh.isActive}, Staff: ${wh.staffId || 'Business-wide'}`);
  });
  
  console.log('\n=== Staff ===');
  console.log('Total staff:', business.staff.length);
  business.staff.forEach(s => {
    console.log(`- ${s.name}: Active: ${s.isActive}, Can Accept Bookings: ${s.canAcceptBookings}`);
  });
  
  console.log('\n=== Services ===');
  console.log('Total services:', business.services.length);
  business.services.forEach(s => {
    console.log(`- ${s.name}: Duration: ${s.duration}min, Price: $${s.price}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });