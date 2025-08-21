# 📧 Configuración de Contraseña de Aplicación de Gmail

## ⚠️ Problema Actual
Gmail está rechazando el login porque necesitas usar una **Contraseña de Aplicación** en lugar de tu contraseña normal.

## 🔐 Pasos para Generar la Contraseña de Aplicación

### 1. Habilitar Verificación en 2 Pasos (Requisito)
1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. En el panel izquierdo, haz clic en **"Seguridad"**
3. Busca **"Verificación en 2 pasos"**
4. Si no está activada, haz clic y sigue los pasos para activarla
   - Necesitarás tu teléfono para recibir códigos de verificación

### 2. Generar Contraseña de Aplicación
1. Una vez activada la verificación en 2 pasos, ve a:
   **https://myaccount.google.com/apppasswords**
   
2. Es posible que te pida tu contraseña nuevamente

3. En "Seleccionar app", elige **"Otra (nombre personalizado)"**

4. Escribe un nombre descriptivo como: **"Dashboard Website Email"**

5. Haz clic en **"Generar"**

6. Google te mostrará una contraseña de 16 caracteres como:
   ```
   xxxx xxxx xxxx xxxx
   ```

7. **IMPORTANTE**: Copia esta contraseña inmediatamente. No la podrás ver de nuevo.

### 3. Actualizar la Configuración

Una vez que tengas la contraseña de aplicación, actualiza el archivo `.env.local`:

```env
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**Nota**: Puedes escribir la contraseña con o sin espacios. Ambas formas funcionan:
- `EMAIL_PASSWORD=abcd efgh ijkl mnop` ✅
- `EMAIL_PASSWORD=abcdefghijklmnop` ✅

## 🔍 Verificación

Para verificar que funciona:
1. Reinicia el servidor (`Ctrl+C` y luego `pnpm dev`)
2. Ejecuta: `node test-email-real.js`
3. Revisa tu bandeja de entrada

## 🚨 Solución de Problemas

### Error: "Username and Password not accepted"
- Asegúrate de que la verificación en 2 pasos esté activada
- Verifica que estés usando la contraseña de aplicación, NO tu contraseña normal
- Confirma que copiaste correctamente la contraseña de 16 caracteres

### Error: "Less secure app access"
- NO necesitas habilitar "acceso de aplicaciones menos seguras"
- Las contraseñas de aplicación son el método seguro recomendado por Google

### La contraseña de aplicación no aparece
- Debes tener la verificación en 2 pasos activada primero
- Si no ves la opción, ve a: Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones

## 📝 Ejemplo de Configuración Final

Tu archivo `.env.local` debería verse así:

```env
# Email Configuration
EMAIL_FROM=appointmentlab@gmail.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=appointmentlab@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # ← Contraseña de aplicación (NO tu contraseña normal)

# Para usar emails reales
USE_TEST_EMAIL=false
```

## 🎯 Estado Actual
- ❌ Usando contraseña normal: **Lab@2025App** (No funciona con Gmail)
- ✅ Necesitas: Contraseña de aplicación de 16 caracteres

---

Una vez que generes y configures la contraseña de aplicación, el sistema de emails funcionará correctamente.