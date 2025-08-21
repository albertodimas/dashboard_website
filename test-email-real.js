// Script para probar el envío de emails reales
const testEmailConfirmation = async () => {
  console.log('🚀 Iniciando prueba de envío de email real...\n');
  
  const appointmentData = {
    customerName: "Test User",
    customerEmail: "appointmentlab@gmail.com", // Enviando a la misma cuenta para prueba
    service: "Premium Haircut",
    date: "2025-01-20",
    time: "14:30",
    price: 35,
    businessName: "Luxury Cuts Barbershop",
    businessAddress: "123 Main Street, Ciudad",
    businessPhone: "+1 234-567-8900"
  };
  
  console.log('📧 Datos de la cita:');
  console.log('  - Cliente:', appointmentData.customerName);
  console.log('  - Email:', appointmentData.customerEmail);
  console.log('  - Servicio:', appointmentData.service);
  console.log('  - Fecha:', appointmentData.date);
  console.log('  - Hora:', appointmentData.time);
  console.log('  - Precio: $' + appointmentData.price);
  console.log('  - Negocio:', appointmentData.businessName);
  console.log('');
  
  try {
    console.log('📤 Enviando email de confirmación...\n');
    
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
      console.log('📬 Detalles del envío:');
      console.log('  - Message ID:', result.messageId);
      console.log('  - Mensaje:', result.message);
      console.log('  - Modo de prueba:', result.testMode ? 'Sí' : 'No');
      
      if (result.previewUrl) {
        console.log('  - URL de vista previa:', result.previewUrl);
      }
      
      console.log('\n🎉 El email fue enviado a:', appointmentData.customerEmail);
      console.log('📎 El email incluye un archivo .ics para agregar al calendario');
      console.log('\n✨ Revisa tu bandeja de entrada (o spam) para ver el email!');
    } else {
      console.error('❌ Error al enviar el email:', result.error);
    }
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté corriendo en http://localhost:3000');
  }
};

// Esperar 5 segundos para que el servidor esté listo
console.log('⏳ Esperando 5 segundos para que el servidor esté listo...\n');
setTimeout(testEmailConfirmation, 5000);