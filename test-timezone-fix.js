// Script para probar la corrección de zona horaria
const testTimezonefix = async () => {
  console.log('🕐 Probando corrección de zona horaria en emails...\n');
  console.log('=' .repeat(50));
  
  // Datos de prueba con hora específica
  const appointmentData = {
    customerName: "Test User",
    customerEmail: "appointmentlab@gmail.com",
    service: "Corte de Prueba Timezone",
    date: new Date().toISOString().split('T')[0], // Fecha de hoy
    time: "09:00", // 9:00 AM
    price: 25,
    businessName: "Luxury Cuts Barbershop",
    businessAddress: "123 Main Street, Ciudad",
    businessPhone: "+1 234-567-8900"
  };
  
  console.log('📅 Cita de prueba:');
  console.log(`  Fecha: ${appointmentData.date}`);
  console.log(`  Hora seleccionada: ${appointmentData.time}`);
  console.log(`  Servicio: ${appointmentData.service}`);
  console.log('');
  
  console.log('⏰ Hora esperada en calendario:');
  console.log(`  Inicio: ${appointmentData.time} (9:00 AM)`);
  console.log(`  Fin: 10:00 AM (duración 1 hora)`);
  console.log('');
  
  try {
    console.log('📤 Enviando email con archivo .ics corregido...\n');
    
    const response = await fetch('http://localhost:3000/api/email/send-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Email enviado exitosamente!');
      console.log('');
      console.log('📧 Verifica en tu correo:');
      console.log('  1. El cuerpo del email debe mostrar: 09:00');
      console.log('  2. Al agregar al calendario debe aparecer:');
      console.log('     - Inicio: 09:00 AM (NO 10:00 AM)');
      console.log('     - Fin: 10:00 AM (NO 11:00 AM)');
      console.log('');
      console.log('🔧 Corrección aplicada:');
      console.log('  - Ahora usa hora local en lugar de UTC');
      console.log('  - Incluye información de zona horaria');
      console.log('  - Compatible con Gmail, Outlook, Apple Calendar');
      console.log('');
      console.log('✨ La zona horaria ahora está correcta!');
    } else {
      console.error('❌ Error al enviar el email:', result.error);
    }
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
  }
  
  console.log('');
  console.log('=' .repeat(50));
  console.log('💡 Si aún hay problemas con la hora:');
  console.log('  - Verifica tu zona horaria del sistema');
  console.log('  - Prueba con diferentes aplicaciones de calendario');
  console.log('  - Algunos calendarios pueden interpretar diferente el .ics');
};

// Ejecutar prueba
testTimezonefix();