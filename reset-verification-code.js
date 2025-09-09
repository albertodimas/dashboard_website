const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function resetVerificationCode() {
  try {
    // Buscar el cliente
    const customer = await prisma.customer.findFirst({
      where: {
        email: 'walny.mc@gmail.com'
      }
    });

    if (!customer) {
      console.log('Cliente no encontrado');
      return;
    }

    console.log('Cliente encontrado:', customer.id, customer.name);

    // Invalidar todos los códigos anteriores
    const invalidated = await prisma.verificationCode.updateMany({
      where: {
        customerId: customer.id,
        type: 'EMAIL_VERIFICATION',
        usedAt: null
      },
      data: {
        usedAt: new Date()
      }
    });

    console.log('Códigos invalidados:', invalidated.count);

    // Crear un nuevo código
    const code = '123456'; // Código fácil para pruebas
    const newCode = await prisma.verificationCode.create({
      data: {
        customerId: customer.id,
        code: code,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      }
    });

    console.log('\n✅ Nuevo código de verificación creado:');
    console.log('============================');
    console.log('Email:', customer.email);
    console.log('Código:', code);
    console.log('Expira en: 30 minutos');
    console.log('============================\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetVerificationCode();