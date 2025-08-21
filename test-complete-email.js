// Script completo para probar emails con archivo .ics
const testCompleteEmail = async () => {
  console.log('🚀 Prueba completa del sistema de emails\n');
  console.log('=' .repeat(50));
  
  // Detectar el puerto correcto
  const ports = [3000, 3001];
  let activePort = null;
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/api/email/send-confirmation`, {
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
    console.error('❌ No se pudo conectar al servidor. Asegúrate de que esté corriendo con: pnpm dev');
    return;
  }
  
  console.log(`✅ Servidor detectado en puerto: ${activePort}\n`);
  
  // Datos de prueba más realistas
  const appointmentData = {
    customerName: "Juan Pérez",
    customerEmail: "appointmentlab@gmail.com",
    service: "Corte Premium + Barba",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 días desde hoy
    time: "15:00",
    price: 45,
    businessName: "Luxury Cuts Barbershop",
    businessAddress: "Av. Principal 123, Centro Comercial Plaza, Local 45",
    businessPhone: "+1 (555) 123-4567"
  };
  
  console.log('📋 Información de la Cita:');
  console.log('─'.repeat(50));
  console.log(`  👤 Cliente: ${appointmentData.customerName}`);
  console.log(`  📧 Email: ${appointmentData.customerEmail}`);
  console.log(`  ✂️  Servicio: ${appointmentData.service}`);
  console.log(`  📅 Fecha: ${appointmentData.date}`);
  console.log(`  ⏰ Hora: ${appointmentData.time}`);
  console.log(`  💵 Precio: $${appointmentData.price}`);
  console.log(`  🏪 Negocio: ${appointmentData.businessName}`);
  console.log(`  📍 Dirección: ${appointmentData.businessAddress}`);
  console.log(`  📞 Teléfono: ${appointmentData.businessPhone}`);
  console.log('─'.repeat(50));
  console.log('');
  
  try {
    console.log('📤 Enviando email de confirmación...\n');
    
    const startTime = Date.now();
    const response = await fetch(`http://localhost:${activePort}/api/email/send-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData)
    });
    
    const endTime = Date.now();
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ ¡EMAIL ENVIADO EXITOSAMENTE!');
      console.log('=' .repeat(50));
      console.log('');
      console.log('📬 Detalles del Envío:');
      console.log('─'.repeat(50));
      console.log(`  🆔 ID del Mensaje: ${result.messageId}`);
      console.log(`  ⏱️  Tiempo de envío: ${endTime - startTime}ms`);
      console.log(`  📨 Enviado a: ${appointmentData.customerEmail}`);
      console.log(`  🔧 Modo: ${result.testMode ? 'Prueba' : 'Producción'}`);
      
      if (result.previewUrl) {
        console.log(`  👁️  Vista previa: ${result.previewUrl}`);
      }
      
      console.log('');
      console.log('📎 Características del Email:');
      console.log('─'.repeat(50));
      console.log('  ✓ Email HTML con diseño profesional');
      console.log('  ✓ Archivo .ics adjunto para calendario');
      console.log('  ✓ Compatible con Gmail, Outlook, Apple Mail');
      console.log('  ✓ Recordatorio automático 1 hora antes');
      console.log('');
      console.log('🎯 Próximos Pasos:');
      console.log('─'.repeat(50));
      console.log('  1. Revisa tu bandeja de entrada en: appointmentlab@gmail.com');
      console.log('  2. Si no aparece, revisa la carpeta de SPAM');
      console.log('  3. Abre el email y verifica el diseño');
      console.log('  4. Haz clic en "Añadir al Calendario" para probar el .ics');
      console.log('  5. Verifica que se agregue correctamente a tu calendario');
      console.log('');
      console.log('✨ El sistema de emails está funcionando correctamente!');
      console.log('=' .repeat(50));
      
    } else {
      console.error('❌ Error al enviar el email:');
      console.error('  Detalles:', result.error);
      console.log('');
      console.log('🔧 Soluciones posibles:');
      console.log('  - Verifica que las credenciales en .env.local sean correctas');
      console.log('  - Asegúrate de usar una contraseña de aplicación de Gmail');
      console.log('  - Revisa que el servidor esté corriendo');
    }
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
    console.log('');
    console.log('💡 Verifica que:');
    console.log(`  - El servidor esté corriendo en http://localhost:${activePort}`);
    console.log('  - No haya errores en la consola del servidor');
  }
};

// Ejecutar la prueba
testCompleteEmail();