# Tareas Pendientes - Sistema de Clientes

## 🎯 Completado Hoy (09/09/2025)

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

### 1. **Auto-Registro en Negocios** 🔴 PRIORITARIO
   - Cuando un cliente se loguea desde la página de un negocio nuevo, debe registrarse automáticamente
   - El negocio debe aparecer en "Mis Servicios" no en "Explorar"
   - Crear relación customer-business automática

### 2. **Sistema de Tracking de Intentos de Login**
   - Crear modelo `LoginAttempt` en Prisma schema:
   ```prisma
   model LoginAttempt {
     id          String   @id @default(cuid())
     email       String
     ipAddress   String?
     userAgent   String?
     success     Boolean
     customerId  String?
     customer    Customer? @relation(fields: [customerId], references: [id])
     attemptedAt DateTime @default(now())
     
     @@index([email, attemptedAt])
     @@index([customerId])
   }
   ```
   - Implementar rate limiting y bloqueo temporal después de 5 intentos fallidos

### 3. **Priorización de Contenido en Dashboard**
   - Los paquetes del negocio referente deben aparecer primero
   - Las citas del negocio referente deben aparecer primero
   - Implementar ordenamiento inteligente basado en el negocio de origen

### 4. **Sistema de Desregistro de Negocios**
   - Permitir al cliente "desregistrarse" de un negocio
   - Usar campo `metadata` del Customer para guardar lista de negocios desregistrados
   - Los negocios desregistrados no deben aparecer en "Mis Servicios"

### 5. **Notificaciones y Recordatorios**
   - Sistema de notificaciones para citas próximas (24h antes)
   - Recordatorio de paquetes por vencer
   - Alertas de sesiones disponibles sin usar

### 6. **Mejoras de UX**
   - Añadir loading states en todas las operaciones asíncronas
   - Mejorar mensajes de error con acciones sugeridas
   - Implementar toast notifications para feedback visual

### 7. **Seguridad**
   - Implementar CSRF protection
   - Añadir rate limiting global a todos los endpoints
   - Validar y sanitizar todos los inputs del usuario

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