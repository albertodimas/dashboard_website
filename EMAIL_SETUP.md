# Email con Resend

## Descripción general
El proyecto utiliza **Resend** como único proveedor de correo tanto en desarrollo como en producción. Si `RESEND_API_KEY` o `RESEND_FROM_EMAIL` no están configurados, los correos no se envían.

## Pasos para habilitarlo

1. **Crear cuenta en Resend**
   - https://resend.com/signup
   - Genera una API key desde *API Keys*.

2. **Verificar tu dominio**
   - Ve a *Domains → Add Domain*.
   - Elige un subdominio (ej. `send.nexodash.com`) y copia los registros MX / TXT / DKIM sugeridos.
   - Añade esos registros en Vercel → *Domains → nexodash.com → DNS Records*.
   - Espera a que el estado cambie a **Verified** en Resend.

3. **Actualizar variables de entorno**
   En `.env`, `.env.local` y/o Vercel añade:
   ```env
   RESEND_API_KEY=re_*******************
   RESEND_FROM_EMAIL="Nexodash <notificaciones@nexodash.com>"
   ```
   Usa una dirección asociada al dominio verificado.

4. **Reiniciar / desplegar**
   - Local: detener `pnpm dev` y volver a iniciarlo.
   - Producción: `git push` para que Vercel redeploye con las nuevas variables.

## Pruebas
- Ejecuta un flujo que envíe correo (registro, recuperación de contraseña, confirmación de cita).
- Revisa el panel de Resend (*Logs*) para ver cada mensaje o observa tu bandeja si usas destinatarios reales.

## Solución de problemas
- **"Resend is not configured"** → falta `RESEND_API_KEY` o `RESEND_FROM_EMAIL`.
- **Dominio sigue en "Pending"** → confirma que los registros DNS coinciden y espera hasta 30 minutos antes de reintentar.
- **Emails llegan a spam** → habilita DMARC y revisa la reputación del remitente.

## Recomendaciones
- Usa un subdominio dedicado (`send.` o `mail.`) para correo transaccional.
- Mantén las API keys fuera del repositorio (`.env` está en `.gitignore`).
- Activa alertas en Resend para detectar tasas de rebote altas.
