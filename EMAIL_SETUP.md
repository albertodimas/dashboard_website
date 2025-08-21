# 📧 Configuración de Email para Confirmaciones de Citas

## Estado Actual
El sistema está configurado para usar **Ethereal Email** (servicio de prueba) por defecto. Los emails no se envían realmente, pero puedes ver una vista previa.

## Para Recibir Emails Reales

### Opción 1: Configurar Gmail (Recomendado)

1. **Habilitar verificación en 2 pasos en tu cuenta de Google:**
   - Ve a https://myaccount.google.com/security
   - Activa la verificación en 2 pasos

2. **Generar contraseña de aplicación:**
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro"
   - Nombra la aplicación (ej: "Dashboard Website")
   - Copia la contraseña generada (16 caracteres)

3. **Actualizar el archivo `.env.local`:**
   ```env
   # Cambiar estas líneas:
   USE_TEST_EMAIL=false
   EMAIL_FROM=tu-negocio@gmail.com
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx  # La contraseña de aplicación de 16 caracteres
   ```

4. **Reiniciar el servidor:**
   ```bash
   # Detener con Ctrl+C y luego:
   pnpm dev
   ```

### Opción 2: Usar Outlook/Hotmail

1. **Actualizar `.env.local`:**
   ```env
   USE_TEST_EMAIL=false
   EMAIL_HOST=smtp-mail.outlook.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=tu-email@outlook.com
   EMAIL_PASSWORD=tu-contraseña-normal
   EMAIL_FROM=tu-email@outlook.com
   ```

### Opción 3: Usar SendGrid (Para Producción)

1. **Crear cuenta en SendGrid:**
   - Ve a https://sendgrid.com
   - Registra una cuenta gratuita

2. **Obtener API Key:**
   - Ve a Settings > API Keys
   - Crea una nueva API Key

3. **Actualizar `.env.local`:**
   ```env
   USE_TEST_EMAIL=false
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=tu-api-key-de-sendgrid
   EMAIL_FROM=verificado@tudominio.com
   ```

## Verificar Configuración

1. **Hacer una reserva de prueba:**
   - Ve a http://localhost:3000/directory
   - Selecciona un negocio
   - Completa el proceso de reserva
   - Usa tu email real

2. **Verificar el email:**
   - Si `USE_TEST_EMAIL=true`: Verás un link de vista previa
   - Si `USE_TEST_EMAIL=false`: Recibirás el email real

## Solución de Problemas

### "Email service not configured"
- Verifica que hayas configurado todas las variables en `.env.local`
- Reinicia el servidor después de cambiar el archivo

### "Invalid login" o "Authentication failed"
- Para Gmail: Asegúrate de usar la contraseña de aplicación (NO tu contraseña normal)
- Verifica que la verificación en 2 pasos esté activa
- Confirma que el email y contraseña sean correctos

### No llegan los emails
- Revisa la carpeta de spam
- Verifica que `USE_TEST_EMAIL=false`
- Confirma que el email del destinatario sea válido
- Revisa los logs del servidor para errores

## Características del Email

✅ **Incluye:**
- Detalles completos de la cita
- Archivo .ics para agregar al calendario
- Diseño HTML profesional
- Soporte bilingüe (español/inglés)

## Notas Importantes

⚠️ **Seguridad:**
- NUNCA subas el archivo `.env.local` a Git
- Usa contraseñas de aplicación, no tu contraseña principal
- En producción, usa servicios profesionales como SendGrid

📝 **Para Desarrollo:**
- Puedes dejar `USE_TEST_EMAIL=true` para no gastar tu cuota de emails
- El link de vista previa funciona perfectamente para pruebas