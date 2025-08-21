// Script para configurar datos de prueba en localStorage
const setupTestData = async () => {
  console.log('🔧 Configurando datos de prueba...\n');
  
  // Detectar puerto
  const ports = [3000, 3001];
  let activePort = null;
  
  // Esperar un poco para que el servidor esté listo
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/dashboard`).catch(() => null);
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
  
  // Servicios de prueba
  const services = [
    {
      id: '1',
      name: 'Classic Haircut',
      description: 'Traditional haircut with styling',
      duration: 30,
      price: 25,
      category: 'Hair',
      isActive: true
    },
    {
      id: '2',
      name: 'Premium Haircut',
      description: 'Premium cut with wash and styling',
      duration: 45,
      price: 35,
      category: 'Hair',
      isActive: true
    },
    {
      id: '3',
      name: 'Beard Trim',
      description: 'Professional beard grooming',
      duration: 20,
      price: 15,
      category: 'Beard',
      isActive: true
    },
    {
      id: '4',
      name: 'Full Shave',
      description: 'Traditional hot towel shave',
      duration: 30,
      price: 20,
      category: 'Shave',
      isActive: true
    },
    {
      id: '5',
      name: 'Hair & Beard Package',
      description: 'Complete grooming package',
      duration: 60,
      price: 40,
      category: 'Packages',
      isActive: true
    },
    {
      id: '6',
      name: 'Kids Haircut',
      description: 'Haircut for children under 12',
      duration: 20,
      price: 18,
      category: 'Hair',
      isActive: true
    }
  ];
  
  // Configuración del negocio
  const businessSettings = {
    businessInfo: {
      name: 'Luxury Cuts Barbershop',
      email: 'info@luxurycuts.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street, New York, NY 10001'
    },
    notifications: {
      email: true,
      sms: false,
      appointmentReminders: true
    },
    language: 'en'
  };
  
  // Guardar en localStorage mediante un script en el navegador
  const setupScript = `
    // Guardar servicios
    localStorage.setItem('services', '${JSON.stringify(services)}');
    console.log('✅ Servicios guardados:', ${services.length});
    
    // Guardar configuración del negocio
    localStorage.setItem('businessSettings', '${JSON.stringify(businessSettings)}');
    console.log('✅ Configuración del negocio guardada');
    
    // Verificar
    const savedServices = JSON.parse(localStorage.getItem('services') || '[]');
    const savedSettings = JSON.parse(localStorage.getItem('businessSettings') || '{}');
    
    console.log('📊 Verificación:');
    console.log('  - Servicios activos:', savedServices.filter(s => s.isActive).length);
    console.log('  - Negocio:', savedSettings.businessInfo?.name);
    
    return { services: savedServices.length, business: savedSettings.businessInfo?.name };
  `;
  
  console.log('📝 Datos a configurar:');
  console.log(`  - ${services.length} servicios`);
  console.log(`  - Negocio: ${businessSettings.businessInfo.name}`);
  console.log('');
  
  console.log('💾 Para aplicar estos datos, ejecuta el siguiente código en la consola del navegador');
  console.log('   mientras estés en http://localhost:' + activePort + ':\n');
  console.log('```javascript');
  console.log(setupScript);
  console.log('```');
  console.log('');
  console.log('O simplemente navega a http://localhost:' + activePort + '/dashboard/services');
  console.log('y crea algunos servicios manualmente.');
  console.log('');
  console.log('✅ Una vez configurados los servicios, las páginas de reserva funcionarán correctamente.');
};

setupTestData();