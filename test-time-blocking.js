// Script para probar el bloqueo de horarios ocupados
const testTimeBlocking = async () => {
  console.log('🕐 Probando sistema de bloqueo de horarios...\n');
  console.log('=' .repeat(50));
  
  const port = 3000;
  const baseUrl = `http://localhost:${port}`;
  
  // Crear algunas citas de prueba para hoy
  const today = new Date().toISOString().split('T')[0];
  
  const testAppointments = [
    {
      id: 'test1',
      customerName: 'Cliente 1',
      service: 'Corte de Pelo',
      date: today,
      time: '10:00',
      status: 'confirmed',
      price: 25,
      customerEmail: 'cliente1@test.com',
      customerPhone: '555-0001'
    },
    {
      id: 'test2', 
      customerName: 'Cliente 2',
      service: 'Barba',
      date: today,
      time: '11:30',
      status: 'pending',
      price: 15,
      customerEmail: 'cliente2@test.com',
      customerPhone: '555-0002'
    },
    {
      id: 'test3',
      customerName: 'Cliente 3',
      service: 'Corte Premium',
      date: today,
      time: '15:00',
      status: 'confirmed',
      price: 35,
      customerEmail: 'cliente3@test.com',
      customerPhone: '555-0003'
    }
  ];
  
  console.log('📅 Configurando citas de prueba para hoy:', today);
  console.log('');
  
  // Simular guardado de citas en localStorage
  console.log('💾 Citas ocupadas:');
  testAppointments.forEach(apt => {
    console.log(`  - ${apt.time}: ${apt.service} (${apt.status})`);
  });
  
  console.log('');
  console.log('🔧 Para probar el sistema:');
  console.log('');
  console.log('1. Abre el navegador en:', `${baseUrl}/directory`);
  console.log('');
  console.log('2. Ejecuta este código en la consola del navegador:');
  console.log('');
  console.log('```javascript');
  console.log(`// Guardar citas de prueba
const testAppointments = ${JSON.stringify(testAppointments, null, 2)};

// Obtener citas existentes
const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');

// Agregar las citas de prueba
const updatedAppointments = [...existingAppointments, ...testAppointments];

// Guardar en localStorage
localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

console.log('✅ Citas de prueba agregadas');
console.log('Horarios ocupados para hoy:');
testAppointments.forEach(apt => console.log('  -', apt.time));`);
  console.log('```');
  console.log('');
  console.log('3. Ve a cualquier negocio para reservar: ', `${baseUrl}/book/luxury-cuts`);
  console.log('');
  console.log('4. Selecciona la fecha de hoy');
  console.log('');
  console.log('5. Verifica que los horarios aparezcan así:');
  console.log('   ❌ 10:00 - Ocupado (en rojo, no seleccionable)');
  console.log('   ❌ 11:30 - Ocupado (en rojo, no seleccionable)');
  console.log('   ❌ 15:00 - Ocupado (en rojo, no seleccionable)');
  console.log('   ✅ Otros horarios - Disponibles (seleccionables)');
  console.log('');
  console.log('=' .repeat(50));
  console.log('✨ Características del sistema:');
  console.log('');
  console.log('✅ Horarios ocupados se muestran en rojo');
  console.log('✅ No se pueden seleccionar horarios ocupados');
  console.log('✅ Se muestra "Ocupado" en el botón');
  console.log('✅ Contador de horarios disponibles');
  console.log('✅ Se actualiza al cambiar de fecha');
  console.log('✅ Solo bloquea citas confirmadas o pendientes');
  console.log('');
  console.log('🔄 Para limpiar las citas de prueba:');
  console.log('   localStorage.setItem("appointments", "[]")');
};

testTimeBlocking();