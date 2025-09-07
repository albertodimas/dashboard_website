const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      customSlug: true,
      isActive: true,
      enableStaffModule: true,
      workingHours: true
    }
  });
  
  // También obtener el staff de cada negocio
  for (const business of businesses) {
    const staffCount = await prisma.staff.count({
      where: { businessId: business.id }
    });
    business.staffCount = staffCount;
  }
  
  console.log('Negocios disponibles:');
  console.log(JSON.stringify(businesses, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });