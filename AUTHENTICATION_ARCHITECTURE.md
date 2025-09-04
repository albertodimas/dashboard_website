# Arquitectura de Autenticación Multi-Tenant

## Resumen
Este sistema soporta múltiples tipos de usuarios con diferentes flujos de autenticación:

## 1. Usuarios del Sistema (Owners/Admins)
- **Login URL**: `/login`
- **Forgot Password URL**: `/forgot-password` 
- **Tabla DB**: `users`
- **Características**:
  - Son dueños o administradores de negocios
  - Pueden gestionar múltiples negocios
  - Tienen un tenant asociado
  - Acceden al dashboard administrativo

## 2. Clientes de Negocios
- **Login URL**: `/[business-slug]/login` o `/cliente/login`
- **Forgot Password URL**: `/cliente/forgot-password`
- **Tabla DB**: `customers`
- **Características**:
  - Son clientes de negocios específicos
  - Un mismo email puede estar registrado en múltiples negocios
  - Cada registro de cliente está asociado a un `businessId` específico
  - Los clientes son únicos por combinación de (email + businessId)
  - Acceden al portal de clientes del negocio

## Flujo de Password Recovery

### Para Owners/Admins (`/forgot-password`)
1. Ingresa email
2. Sistema busca en tabla `users`
3. Envía código de 6 dígitos por email
4. Usuario ingresa código
5. Cambia contraseña
6. Redirige a `/login`

### Para Clientes (`/cliente/forgot-password`)
1. Ingresa email
2. Sistema busca en tabla `customers` (puede haber múltiples con mismo email)
3. Envía código de 6 dígitos por email
4. Cliente ingresa código
5. Cambia contraseña
6. Genera token de autenticación
7. Redirige a `/cliente/dashboard`

## Importante: Separación de Datos

### Multi-Tenancy para Clientes
- Un cliente con email `john@example.com` puede tener cuentas en:
  - Negocio A (businessId: 1)
  - Negocio B (businessId: 2)
  - Negocio C (businessId: 3)
- Cada cuenta es independiente con su propia contraseña
- Los datos del cliente en cada negocio están aislados

### APIs Unificadas
- `/api/auth/forgot-password`: Maneja ambos tipos con parámetro `userType`
  - `userType: 'user'` para owners/admins
  - `userType: 'cliente'` para clientes
- `/api/auth/reset-password`: Similar estructura con `userType`

## Seguridad
- Contraseñas hasheadas con bcrypt (10 rounds)
- Códigos de verificación de 6 dígitos con expiración de 15 minutos
- Tokens JWT para sesiones
- HttpOnly cookies para owners/admins
- LocalStorage tokens para clientes (por negocio)

## Tablas de Base de Datos

### users (Owners/Admins)
- id
- tenantId
- email (único globalmente)
- passwordHash
- name
- ...

### customers (Clientes)
- id
- businessId (FK a businesses)
- email (puede repetirse entre diferentes businessId)
- password
- name
- emailVerified
- ...

### verificationCodes
- id
- customerId (FK a customers, nullable)
- userId (FK a users, nullable)
- code
- type (PASSWORD_RESET, EMAIL_VERIFICATION)
- expiresAt
- usedAt
- ...

## URLs y Rutas

### Sistema Administrativo
- `/login` - Login de owners/admins
- `/register` - Registro de nuevos owners
- `/dashboard` - Dashboard administrativo
- `/forgot-password` - Recuperación de contraseña

### Portal de Clientes
- `/cliente/login` - Login genérico de clientes
- `/cliente/register` - Registro de clientes
- `/cliente/dashboard` - Dashboard de clientes
- `/cliente/forgot-password` - Recuperación de contraseña
- `/[business-slug]` - Página pública del negocio
- `/[business-slug]/book` - Sistema de reservas del negocio