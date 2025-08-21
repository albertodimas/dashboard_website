// Script para crear usuario demo directamente
const createDemoUser = async () => {
  console.log('👤 Creando usuario demo...\n');
  
  // Detectar puerto
  const ports = [3000, 3001];
  let activePort = null;
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/api/auth/register`, {
        method: 'GET'
      }).catch(() => null);
      if (response) {
        activePort = port;
        break;
      }
    } catch (e) {
      // Puerto no disponible
    }
  }
  
  if (!activePort) {
    console.error('❌ Servidor no detectado. Ejecuta: pnpm dev');
    return;
  }
  
  console.log(`✅ Servidor en puerto ${activePort}\n`);
  
  // Crear usuario demo
  const userData = {
    name: 'Demo User',
    email: 'demo@barbershop.com',
    password: 'demo12345',  // Mínimo 8 caracteres
    businessName: 'Luxury Cuts Barbershop'
  };
  
  console.log('📝 Registrando usuario:');
  console.log('  Nombre:', userData.name);
  console.log('  Email:', userData.email);
  console.log('  Password:', userData.password);
  console.log('  Negocio:', userData.businessName);
  console.log('');
  
  try {
    const response = await fetch(`http://localhost:${activePort}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ ¡Usuario demo creado exitosamente!');
      console.log('');
      console.log('🎯 Ahora puedes hacer login con:');
      console.log('  URL: http://localhost:' + activePort + '/login');
      console.log('  Email: demo@barbershop.com');
      console.log('  Password: demo12345');
      console.log('');
      console.log('📊 Accede al dashboard en:');
      console.log('  http://localhost:' + activePort + '/dashboard');
    } else {
      console.error('❌ Error al crear usuario:', result.error || 'Error desconocido');
      
      if (result.error && result.error.includes('already exists')) {
        console.log('\n✅ El usuario ya existe. Puedes hacer login con:');
        console.log('  Email: demo@barbershop.com');
        console.log('  Password: demo12345');
      }
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n💡 Posibles soluciones:');
    console.log('  1. Verifica que PostgreSQL esté corriendo: docker ps');
    console.log('  2. Verifica que el servidor esté corriendo: pnpm dev');
    console.log('  3. Sincroniza la base de datos: cd packages/db && npx prisma db push');
  }
};

createDemoUser();