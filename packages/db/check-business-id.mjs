import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Buscar todos los businesses
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      customSlug: true,
      isActive: true,
      isBlocked: true
    }
  });

  console.log('All businesses:');
  businesses.forEach(b => {
    console.log(`- ID: ${b.id}`);
    console.log(`  Name: ${b.name}`);
    console.log(`  Slug: ${b.slug}`);
    console.log(`  CustomSlug: ${b.customSlug}`);
    console.log(`  Active: ${b.isActive}, Blocked: ${b.isBlocked}`);
    console.log('');
  });

  // Buscar específicamente por el ID
  const targetId = 'f0501ec8-7da2-4204-81a8-4765f94d3ea6';
  const specificBusiness = await prisma.business.findUnique({
    where: { id: targetId }
  });

  console.log(`\nSearching for ID: ${targetId}`);
  if (specificBusiness) {
    console.log('Found business:', specificBusiness.name);
  } else {
    console.log('Business NOT found with this ID');
  }

  // Buscar por customSlug
  const byCustomSlug = await prisma.business.findFirst({
    where: { customSlug: 'wmc/welcome' }
  });

  if (byCustomSlug) {
    console.log('\nBusiness with customSlug "wmc/welcome":');
    console.log('  ID:', byCustomSlug.id);
    console.log('  Name:', byCustomSlug.name);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });