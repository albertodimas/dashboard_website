// Script para probar el login
const testLogin = async () => {
  console.log('🔐 Probando sistema de autenticación...\n');
  
  // Detectar puerto
  const ports = [3000, 3001];
  let activePort = null;
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/api/auth/login`, {
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
  
  // Probar login con cuenta demo
  console.log('📧 Intentando login con cuenta demo...');
  console.log('  Email: demo@barbershop.com');
  console.log('  Password: demo123\n');
  
  try {
    const response = await fetch(`http://localhost:${activePort}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@barbershop.com',
        password: 'demo123'
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Login exitoso!');
      console.log('  Usuario:', result.user.name);
      console.log('  Email:', result.user.email);
    } else {
      console.log('❌ Login falló:', result.error || 'Error desconocido');
      
      // Si el usuario no existe, intentar crearlo
      if (result.error && result.error.includes('not found')) {
        console.log('\n📝 Usuario no existe. Intentando crear cuenta demo...');
        
        const registerResponse = await fetch(`http://localhost:${activePort}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Demo User',
            email: 'demo@barbershop.com',
            password: 'demo123',
            businessName: 'Demo Barbershop'
          })
        });
        
        const registerResult = await registerResponse.json();
        
        if (registerResponse.ok && registerResult.success) {
          console.log('✅ Cuenta demo creada exitosamente!');
          console.log('  Ahora puedes hacer login con:');
          console.log('  Email: demo@barbershop.com');
          console.log('  Password: demo123');
        } else {
          console.log('❌ Error al crear cuenta:', registerResult.error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
};

testLogin();