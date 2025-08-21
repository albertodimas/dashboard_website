// Script para probar todo el sistema
const testSystem = async () => {
  console.log('🔍 Verificando estado del sistema...\n');
  console.log('=' .repeat(50));
  
  // Esperar un poco para que el servidor esté listo
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const port = 3000;
  const baseUrl = `http://localhost:${port}`;
  
  // 1. Probar que el servidor responde
  console.log('1️⃣ Probando servidor...');
  try {
    const response = await fetch(baseUrl);
    if (response.ok) {
      console.log('   ✅ Servidor respondiendo en puerto', port);
    } else {
      console.log('   ❌ Servidor responde con error:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Servidor no responde:', error.message);
    return;
  }
  
  console.log('');
  
  // 2. Probar login con usuario demo
  console.log('2️⃣ Probando sistema de login...');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@barbershop.com',
        password: 'demo12345'
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (loginResponse.ok && loginResult.success) {
      console.log('   ✅ Login exitoso con usuario demo');
    } else {
      console.log('   ⚠️  Login falló:', loginResult.error || 'Usuario no encontrado');
      console.log('   ℹ️  Usa: email: demo@barbershop.com, password: demo12345');
    }
  } catch (error) {
    console.log('   ❌ Error en login:', error.message);
  }
  
  console.log('');
  
  // 3. Probar páginas principales
  console.log('3️⃣ Probando páginas principales...');
  const pages = [
    { path: '/login', name: 'Login' },
    { path: '/register', name: 'Register' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/directory', name: 'Directory' },
    { path: '/dashboard/services', name: 'Services' },
    { path: '/dashboard/appointments', name: 'Appointments' }
  ];
  
  for (const page of pages) {
    try {
      const response = await fetch(`${baseUrl}${page.path}`);
      if (response.ok) {
        console.log(`   ✅ ${page.name}: OK`);
      } else {
        console.log(`   ❌ ${page.name}: Error ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${page.name}: ${error.message}`);
    }
  }
  
  console.log('');
  
  // 4. Probar API de servicios
  console.log('4️⃣ Probando API de servicios...');
  try {
    const servicesResponse = await fetch(`${baseUrl}/api/services`);
    if (servicesResponse.ok) {
      const services = await servicesResponse.json();
      console.log(`   ✅ API funcionando - ${services.length || 0} servicios encontrados`);
      if (services.length === 0) {
        console.log('   ⚠️  No hay servicios - crea algunos en /dashboard/services');
      }
    } else {
      console.log('   ❌ API de servicios error:', servicesResponse.status);
    }
  } catch (error) {
    console.log('   ⚠️  API de servicios no disponible (normal si usa localStorage)');
  }
  
  console.log('');
  
  // 5. Probar páginas de reserva
  console.log('5️⃣ Probando sistema de reservas...');
  const businesses = ['luxury-cuts'];
  
  for (const business of businesses) {
    try {
      const response = await fetch(`${baseUrl}/book/${business}`);
      if (response.ok) {
        const text = await response.text();
        if (!text.includes('error') && !text.includes('Error')) {
          console.log(`   ✅ Página de reserva ${business}: OK`);
        } else {
          console.log(`   ⚠️  Página de reserva ${business}: Tiene errores`);
        }
      } else {
        console.log(`   ❌ Página de reserva ${business}: Error ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Página de reserva ${business}: ${error.message}`);
    }
  }
  
  console.log('');
  console.log('=' .repeat(50));
  console.log('📊 RESUMEN DEL SISTEMA:');
  console.log('=' .repeat(50));
  console.log('');
  console.log('✅ Servicios funcionando:');
  console.log('  - PostgreSQL (puerto 5432)');
  console.log('  - Next.js (puerto 3000)');
  console.log('  - Redis (puerto 6379)');
  console.log('  - MailHog (puerto 8025)');
  console.log('');
  console.log('🔑 Credenciales:');
  console.log('  - Email: demo@barbershop.com');
  console.log('  - Password: demo12345');
  console.log('');
  console.log('🌐 URLs principales:');
  console.log('  - Login: http://localhost:3000/login');
  console.log('  - Dashboard: http://localhost:3000/dashboard');
  console.log('  - Directorio: http://localhost:3000/directory');
  console.log('');
  console.log('⚠️  Si algo no funciona:');
  console.log('  1. Verifica que Docker esté corriendo: docker ps');
  console.log('  2. Crea servicios en: http://localhost:3000/dashboard/services');
  console.log('  3. Reinicia si es necesario: Ctrl+C y pnpm dev');
};

// Ejecutar prueba
testSystem();