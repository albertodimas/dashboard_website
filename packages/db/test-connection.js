const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Intentar hacer una consulta simple
    const userCount = await prisma.user.count();
    console.log('✅ Conexión exitosa!');
    console.log('📊 Usuarios en la base de datos:', userCount);
    
    // Verificar si existe el usuario walny.mc@gmail.com
    const user = await prisma.user.findFirst({
      where: { email: 'walny.mc@gmail.com' }
    });
    
    if (user) {
      console.log('✅ Usuario walny.mc@gmail.com encontrado');
      console.log('   ID:', user.id);
      console.log('   Nombre:', user.name);
    } else {
      console.log('❌ Usuario walny.mc@gmail.com NO encontrado');
    }
    
    // Listar tablas
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    console.log('\n📋 Tablas en la base de datos:');
    tables.forEach(t => console.log('   -', t.tablename));
    
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();