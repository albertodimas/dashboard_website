// Script para probar el sistema de reservas
const testBooking = async () => {
  console.log('🔍 Probando sistema de reservas públicas...\n');
  
  // Detectar puerto
  const ports = [3000, 3001];
  let activePort = null;
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/directory`).catch(() => null);
      if (response && response.ok) {
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
  
  // Probar páginas de booking
  const businesses = ['luxury-cuts', 'glamour-nails', 'style-studio', 'wellness-spa'];
  
  console.log('📋 Probando páginas de reserva:\n');
  
  for (const business of businesses) {
    const url = `http://localhost:${activePort}/book/${business}`;
    console.log(`🔗 Probando: ${url}`);
    
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        const text = await response.text();
        
        // Verificar si la página carga correctamente
        if (text.includes('error') || text.includes('Error')) {
          console.log(`  ❌ Página carga pero contiene errores`);
          
          // Buscar errores específicos
          if (text.includes('Cannot read')) {
            console.log(`     Error: Problema leyendo propiedades`);
          }
          if (text.includes('localStorage')) {
            console.log(`     Error: Problema con localStorage`);
          }
          if (text.includes('undefined')) {
            console.log(`     Error: Variable undefined`);
          }
        } else if (text.includes(business.replace(/-/g, ' '))) {
          console.log(`  ✅ Página carga correctamente`);
        } else {
          console.log(`  ⚠️  Página carga pero puede tener problemas`);
        }
      } else {
        console.log(`  ❌ Error HTTP: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`  ❌ Error de conexión: ${error.message}`);
    }
  }
  
  console.log('\n📊 Verificando servicios en localStorage:');
  
  // Verificar si hay servicios guardados
  try {
    const servicesUrl = `http://localhost:${activePort}/api/services`;
    const response = await fetch(servicesUrl).catch(() => null);
    
    if (response && response.ok) {
      const services = await response.json();
      console.log(`  ✅ API de servicios responde con ${services.length || 0} servicios`);
    } else {
      console.log('  ⚠️  No se pudo acceder a la API de servicios');
      console.log('     Los servicios deberían estar en localStorage');
    }
  } catch (error) {
    console.log('  ℹ️  API de servicios no disponible (usando localStorage)');
  }
  
  console.log('\n💡 Soluciones posibles:');
  console.log('  1. Asegúrate de tener servicios creados en el dashboard');
  console.log('  2. Ve a /dashboard/services y crea algunos servicios');
  console.log('  3. Los servicios deben estar marcados como "activos"');
  console.log('  4. Verifica que localStorage no esté vacío');
};

testBooking();