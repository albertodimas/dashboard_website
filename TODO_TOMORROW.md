# Tareas Pendientes - Sistema de Clientes

## Sesión 2025-09-11 — Notas de cierre

Resumen de hoy:
- Autenticación cliente: mensajes 401/429 claros; preservación `from` en login→verify→login.
- Modelo de datos: `customers.email` único global + CITEXT (case-insensitive). Script de consolidación de duplicados por email.
- Dashboard cliente: fallback por email, reemisión de token, y `BusinessCustomer` multi-tenant.
- Registro de dueño (/register): nombre y apellidos; disponibilidad en vivo de email/subdominio; creación transaccional de tenant+user; manejo de errores P2002.
- Settings negocio: verificación en vivo de `customSlug` con sugerencias; validación básica de `customDomain` para futura verificación DNS.

Pendientes prioridad alta (para retomar):
1) Registro de dueño falla en “Complete Registration” en algunos casos aunque disponibilidad sea OK.
   - Reproducir con Network abierto y capturar respuesta de `/api/auth/register` (en dev incluye `details`).
   - Verificar que no quede `tenant` sin `user` (transacción ya aplicada, confirmar en logs).
   - Consultas útiles:
     - `SELECT id,email FROM users WHERE email='<email>'`.
     - `SELECT id,subdomain FROM tenants WHERE subdomain='<subdomain>'`.
   - Revisar `send-verification`: bloquea si email ya existe (409). Confirmar flujo cuando envías el código y luego cambias el email.

2) Settings negocio — completar “Custom Domain” (futuro):
   - Añadir verificación DNS opcional (CNAME/A) detrás de flag.
   - Persistir estado de verificación en `business.settings.customDomainVerified`.
   - Endpoint POST `/api/dashboard/domain/verify` (pendiente) con comprobación DNS y marcas de tiempo.

3) UI ajustes menores:
   - Mostrar `lastName` del dueño en `/dashboard/settings` → cabeceras si aplica.
   - Deshabilitar “Save Settings” si slug/domain inválidos (ya hecho); revisar copy de ayuda.

4) Pruebas rápidas a cubrir mañana:
   - Registro dueño con email nuevo y subdominio disponible → creación ok.
   - Registro dueño con email duplicado → inline error y bloqueo del submit.
   - Cambiar `customSlug` a uno ocupado → UI muestra sugerencia y bloquea guardar.
   - Dashboard cliente tras registro/verify → perfil muestra nombre/apellidos.

Punto de reanudación sugerido:
- Rama: `master`
- Commit HEAD: actualizar en consola `git log -1 --oneline` antes de iniciar; hoy quedó en el último commit mostrado al cerrar la sesión.
- Empezar por reproducir el error de `/api/auth/register` con Network y revisar logs del servidor.

## 🎯 Completado Hoy (10/09/2025)

### ✅ Tareas Prioritarias Completadas
1. **Auto-Registro en Negocios** ✅
   - Implementado en `/api/cliente/auth/login/route.ts`
   - Crea automáticamente relación BusinessCustomer cuando el cliente se loguea desde un negocio nuevo
   - Actualiza contadores de visitas y reactiva relaciones desactivadas

2. **Sistema de Tracking de Intentos de Login** ✅
   - Modelo LoginAttempt ya existía en el schema
   - Implementado rate limiting: máximo 5 intentos en 15 minutos
   - Registra todos los intentos (exitosos y fallidos) con IP y User Agent

3. **Priorización de Contenido por Negocio Referente** ✅
   - Los negocios del cliente se ordenan con el referente primero
   - Los paquetes del negocio referente aparecen primero
   - Las citas del negocio referente aparecen primero
   - Cookie `referring-business` para mantener contexto

4. **Sistema de Desregistro de Negocios** ✅
   - Endpoint `/api/cliente/businesses/unregister` con POST y PUT
   - Soft delete en BusinessCustomer (isActive = false)
   - Guarda lista de negocios desregistrados en metadata del Customer
   - Validación: no permite desregistro con citas pendientes o paquetes activos
   - Botón de desregistro en el dashboard con modal de confirmación

5. **Depuración de Error 500 en Dashboard** ⚠️ PARCIAL
   - Identificado problema con logs que causaban error 500
   - Corregido parcialmente eliminando JSON.stringify de objetos grandes
   - Los datos SÍ están correctos en la BD (verificado con Prisma Studio)
   - Cliente `a56b7ac6-682a-4412-8add-91a9def260d7` tiene todos los campos correctos
   - **PENDIENTE**: Aún hay un log misterioso "Customer data: {" que se corta y causa error

## 🎯 Completado Ayer (09/09/2025)

### ✅ Correcciones Principales
1. **Formulario de Registro de Cliente**
   - Separados campos nombre y apellido (antes era un solo campo "Nombre Completo")
   - Añadido campo de confirmación de contraseña con validación
   - Validación de contraseña segura con requisitos específicos

2. **Flujo de Autenticación**
   - Implementado flujo tradicional: registro → verificación email → redirect a login
   - Eliminado auto-login después de verificación
   - Creados endpoints faltantes: `/api/cliente/auth/resend-verification` y `/api/cliente/auth/check-verification-pending`

3. **Sistema de Login**
   - Corregido error "Cannot read properties of undefined" 
   - Eliminadas referencias a modelos Prisma inexistentes (`loginAttempt`, `businessCustomer`)
   - Simplificado proceso de login sin rate limiting

4. **Portal Multi-Tenant**
   - Creado endpoint `/api/cliente/businesses` para gestión multi-tenant
   - Implementado portal unificado para clientes con mismo email y contraseña
   - Los negocios donde está registrado aparecen en "Mis Servicios"

5. **Integración con Páginas de Negocio**
   - Actualizado `BusinessLandingEnhanced.tsx` para redirigir a `/cliente/login`
   - Añadido parámetro `from` para retornar a la página del negocio después del login
   - Cookie `referring-business` para priorizar contenido

## 📋 Pendiente para Mañana

### 0. **FIX CRÍTICO: Error 500 en Dashboard** 🔴 URGENTE
   - Encontrar y eliminar el console.log que imprime "Customer data: {" 
   - Este log aparece en los logs del servidor pero no está en el código fuente
   - Posiblemente está en algún archivo compilado o en caché
   - El error impide que los datos del cliente se muestren aunque están correctos en BD

### 1. **Notificaciones y Recordatorios** 🔴 PRIORITARIO
   - Sistema de notificaciones para citas próximas (24h antes)
   - Recordatorio de paquetes por vencer
   - Alertas de sesiones disponibles sin usar

### 2. **Mejoras de UX**
   - Añadir loading states en todas las operaciones asíncronas
   - Mejorar mensajes de error con acciones sugeridas
   - Implementar toast notifications para feedback visual

### 3. **Seguridad**
   - Implementar CSRF protection
   - Añadir rate limiting global a todos los endpoints
   - Validar y sanitizar todos los inputs del usuario

### 4. **Sistema de Recuperación de Contraseña**
   - Endpoint para solicitar recuperación con email
   - Token temporal con expiración de 1 hora
   - Página de reset de contraseña
   - Validación de nueva contraseña

### 5. **Dashboard Métricas del Cliente**
   - Total gastado por negocio
   - Número de visitas por negocio
   - Gráficos de uso de paquetes
   - Historial de citas completadas

### 6. **Optimización de Performance**
   - Implementar paginación en listas largas
   - Lazy loading de imágenes
   - Caché de datos frecuentes
   - Optimizar queries de Prisma

## 🐛 Bugs Conocidos
1. El campo `tenantId` en Customer puede ser null pero el sistema asume que siempre existe
2. La verificación de email no expira (debería expirar después de 24h)
3. No hay validación de formato de teléfono en el registro

## 📝 Notas Importantes
- El sistema es multi-tenant: cada negocio pertenece a un tenant
- Los customers pueden existir en múltiples tenants con el mismo email
- Se usa JWT con cookies HTTP-only para autenticación
- El sistema de verificación usa códigos de 6 dígitos

## 🔧 Archivos Clave Modificados
- `/apps/web/app/api/cliente/auth/login/route.ts`
- `/apps/web/app/api/cliente/auth/register/route.ts`
- `/apps/web/app/api/cliente/businesses/route.ts`
- `/apps/web/app/cliente/dashboard/page.tsx`
- `/apps/web/app/cliente/login/page.tsx`
- `/apps/web/components/business/BusinessLandingEnhanced.tsx`

## 💡 Sugerencias de Mejora
1. Considerar implementar OAuth (Google, Facebook) para login social
2. Añadir 2FA para mayor seguridad
3. Implementar sistema de recuperación de contraseña
4. Añadir analytics de uso del portal del cliente
5. Crear dashboard metrics para el cliente (gastos, visitas, etc.)


## 2025-09-12 – i18n cleanup + next steps
- Eliminado anti patron language === 'en' y migrado a t(..).
- Claves nuevas agregadas en translations en y es.
- Fix LanguageSelector y copys de Settings/Packages/Purchases.

Para retomar: retoma desde 5a7c349
## Sesión 2025-09-21 - Pendientes próximos

- Documentar setup local con el mismo .env remoto (Supabase/Upstash) y atajo de seed contra Supabase.
  - Copiar `.env.example` → `.env` y completar con valores reales (no commitear).
  - Ajustar `packages/db/.env` para apuntar a Supabase:
    - `DATABASE_URL=postgresql://<user>:<pass>@<supabase-host>:6543/postgres?schema=public&pgbouncer=true`
    - `DIRECT_URL=postgresql://<user>:<pass>@<supabase-host>:5432/postgres?schema=public`
  - Variables clave a espejar: `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL` (Upstash), `JWT_SECRET`, `CLIENT_JWT_SECRET`, `REFRESH_SECRET`, `NEXTAUTH_URL`, `APP_BASE_URL`.
  - Empujar schema y seed contra Supabase:
    - `pnpm --filter @nexodash/db db:push`
    - `pnpm --filter @nexodash/db db:seed`

- Validar login admin antes de email:
  - `node create-admin-user.js`
  - Abrir `http://localhost:3000/admin/login` → `admin@nexodash.com` / `password123`.

- Revisar envío de email (Resend/SMTP):
  - Por ahora `apps/web/lib/email.ts` usa Nodemailer (SMTP) + MailHog en dev.
  - Endpoints: `/api/auth/send-verification` y `/api/cliente/auth/send-verification`.
  - Observar logs JSON en terminal. En dev, ver MailHog: `http://localhost:8025`.
  - Dev helper: `GET /api/get-verification-code?email=<email>` (en prod requiere `x-internal-key`).

- Reprobar registro/login remoto:
  - Registro: completar formulario → verificar que llega el código → `Complete Registration` ok.
  - Login: tras verificar, abrir sesión y recibir cookies (cliente o admin según flujo).
  - En Vercel/Supabase comprobar que `RESEND_API_KEY` o `EMAIL_*` estén completos si se desea email real.
