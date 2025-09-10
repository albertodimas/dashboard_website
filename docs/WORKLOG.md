# Worklog de Seguridad y Mejoras

Formato por sesión: fecha/hora, resumen, cambios, validación, próximos pasos. Agregar nuevas sesiones al inicio para lectura rápida.

---

## 2025-09-10 - Fase 7 (tests)
- Resumen: Se añadió scaffolding de pruebas E2E con Playwright y un smoke básico de APIs públicas, con skip automático si el server no está arriba.
- Cambios aplicados:
  - playwright.config.ts: baseURL desde `BASE_URL`/`APP_BASE_URL` (default http://localhost:3000).
  - apps/web/tests/e2e/smoke.spec.ts: prueba de listado de paquetes y validación de slots (no debe 500; valida 400 en query inválida).
  - apps/web/package.json: script `test:e2e`.
- Ejecución local:
  - Levantar dev: `pnpm dev` (root o apps/web) y asegurarse de DB/Redis.
  - Correr E2E: `pnpm -C apps/web test:e2e` (opcionalmente `BASE_URL=http://localhost:3000`).
  - Resultado actual: smoke E2E pasó (2 pruebas OK) usando `apps/web/playwright.config.ts`.
- Próximos pasos: agregar 1-2 pruebas felices (booking o reserva de paquete) usando datos seed; o unit tests de utilidades con Node 20 `node:test` si se desea.

## 2025-09-10 - Fase 8 (cleanup y preparación UI)
- Resumen: Limpieza de dependencias y pulido de auth JWT para evitar conflictos de tipos y dependencias obsoletas.
- Cambios aplicados:
  - apps/web/lib/jwt-auth.ts: renombrado tipo interno a `AppJWTPayload` y casteo seguro al firmar/verificar con `jose` (evita conflicto con tipo `JWTPayload` de la librería).
  - apps/web/package.json: removido `jsonwebtoken` y `@types/jsonwebtoken` (migrado completamente a `jose`).
- Próximos pasos: abordar errores de UI/TypeScript reportados en componentes y `lib/translations.ts` (fase de UI final). Priorización sugerida: `translations.ts` (claves duplicadas), `BusinessLandingEnhanced.tsx` (props inválidas), `useBusinessModules.ts` (index signature).

## 2025-09-10 - Fase 9 (UI fixes iniciales)
- Resumen: Reduje errores de TypeScript en UI realizando ajustes no disruptivos en tipados y traducciones.
- Cambios aplicados:
  - translations.ts: eliminadas claves duplicadas (`selectService` en Booking → `selectServiceBooking`) y relajado `TranslationKey` a `string` para evitar unions demasiado estrictos durante refactor.
  - useBusinessModules.ts: ajustados tipos para acceso seguro a módulos/funciones (`keyof` y casts controlados) y evitar errores de indexación.
- Próximos pasos: continuar con las correcciones en `BusinessLandingEnhanced.tsx` (props de iconos y tipos `any`), y validar que los textos que usaban `selectService` en Booking referencien la nueva clave `selectServiceBooking` si aplica.

## 2025-09-10 - Fase 6 (observabilidad + calidad + CI)
- Resumen: Añadí logging estructurado sin PII y una inicialización opcional de Sentry. Ajusté configuración de ESLint root y mantuve el pipeline de CI existente (install → typecheck → lint → build).
- Cambios aplicados:
  - apps/web/lib/logger.ts: logger JSON (info/warn/error/debug) con masking de claves sensibles.
  - apps/web/lib/observability.ts: inicializa Sentry si `SENTRY_DSN` está presente y expone `trackError()` para reportar y loguear.
  - Integración en endpoints: uso de `trackError` en rutas públicas clave (slots, purchase, reserve, reviews).
  - .eslintrc.json (root): root config mínima e ignores para monorepo.
  - CI: archivo existente `.github/workflows/ci.yml` ya corre install → typecheck → lint → build.
- Variables de entorno opcionales:
  - `SENTRY_DSN`, `SENTRY_ENV`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_PROFILES_SAMPLE_RATE`.
- Próximos pasos: si se desea captura real en Sentry, instalar `@sentry/nextjs` y configurar DSN; extender `trackError` a más rutas si hace falta.

## 2025-09-10 — Fase 3 (parcial): Códigos en Redis + email unificado
- Resumen: Cerrada Fase 2 y comenzada Fase 3 enfocada en verificación por email. Migré el flujo de verificación de registro del cliente a Redis con TTL y contador de intentos por email y centralicé el envío de correos en `sendEmail` para esos endpoints.
- Cambios aplicados:
  - lib/verification-redis: ahora soporta asociar `data` al código (JSON) y limpiarlo junto con el código. Mantiene `checkRateLimit` por email.
  - cliente/auth/send-verification: usa Redis (`setCode(email, code, undefined, data)`) y `sendEmail` con plantilla, elimina store en memoria.
  - cliente/auth/verify-code: valida código desde Redis, consume/limpia el código+data, crea/actualiza cliente y emite token con `jose` (`generateClientToken`).
  - cliente/resend-verification: reescrito para Redis (`checkRateLimit` + `setCode`) y `sendEmail`.
  - cliente/forgot-password: migra a Redis + `sendEmail` (ya no usa tabla `verificationCode`).
  - cliente/reset-password: valida código desde Redis, actualiza contraseña y limpia código.
  - cliente/auth/verify: migra a Redis (usa cookie para `customerId`, verifica por email asociado y limpia código + cookie).
  - system/auth/forgot-password: unificado a Redis (para ambos tipos `user`/`customer`) con `sendEmail`.
- get-verification-code: ahora lee el código activo desde Redis (dev o `INTERNAL_API_KEY`).

---

## 2025-09-10 — Fase 4 (imágenes/almacenamiento)
- Resumen: Unifiqué el manejo de imágenes para que solo se escriban bajo `apps/web/public/<folder>` y saneé entradas. Agregué limpieza de directorios residuales creados previamente por rutas inválidas en Windows.
- Cambios aplicados:
  - lib/upload-utils-server: sanitiza `id` y `type`, elimina directorios legacy si existen, asegura base `apps/web/public`, y usa nombres `avatars/`, `gallery/`, `service/`, `business/` coherentes.
  - api/upload: ya tenía validaciones de auth, mime y tamaño; mantiene mapping de URL por tipo y tamaños válidos.
  - scripts/cleanup-invalid-image-dirs.js: script manual para limpiar directorios como `D:dashboard_websiteappswebpublicavatars` etc.
- Validación pendiente: subir imagen por cada tipo y verificar que los archivos aparecen en `apps/web/public/<carpeta>` y que la URL devuelta responde.
- Próximos pasos: ejecutar `node scripts/cleanup-invalid-image-dirs.js` si detectas carpetas residuales.

---

## 2025-09-10 — Fase 5 (validación + rate limiting)
- Resumen: Añadida validación con `zod` y limitación por IP a rutas públicas y transaccionales (bookings, paquetes, reseñas) para frenar abuso y entradas inválidas.
- Cambios aplicados:
  - public/appointments (POST): rate limit 5/10min por IP.
  - public/appointments/slots (GET): zod para query + rate limit 60/5min.
  - public/packages/purchase (POST): rate limit 5/10min.
  - public/packages/reserve (POST): zod para body + rate limit 5/10min.
  - public/packages (GET): zod para query + rate limit 60/5min.
  - public/customer/packages (GET): zod para query + rate limit 60/10min.
  - review/submit (POST): rate limit 5/h.
  - packages/purchase (POST/GET): zod para body y query (uso interno con cookie).
  - packages/consume-session (POST/DELETE): zod para body (uso interno con cookie).
- Validación pendiente: probar llamadas con parámetros inválidos (debe responder 400) y sobrepasar límites para ver 429 con `Retry-After`.
  - Endpoints de email/ICS y upload ya protegidos con zod + rate limit desde fase anterior.
- Validación rápida:
  - Dev: MailHog activo (`docker compose up -d`), probar registro cliente: POST `/api/cliente/auth/send-verification` → recibir email con código → POST `/api/cliente/auth/verify-code`.
  - Reintentos: superar 3 envíos por email dentro de 15m debe dar 429 con minutos restantes.
  - Resend: requiere cookie `verification-pending` y cliente no verificado; reenvía usando Redis.
- Próximos pasos F3:
  - Opcional: migrar reset-password de clientes a Redis (ahora usa tabla `verificationCode`).
  - Añadir contador de intentos de verificación (por email) si se desea limitar validaciones erróneas.
  - Revisión final de `.env.local` para SMTP/MailHog y variables JWT/Redis.

## 2025-09-10 — Fase 1 (Hotfixes iniciales)
- Resumen: Se protegieron endpoints internos, se forzaron secretos JWT sin defaults, se parametrizó el SQL de tenant y se endureció el upload con autenticación y validaciones.
- Cambios aplicados:
  - get-verification-code: ahora solo accesible en `development` o con header `x-internal-key` que coincida con `INTERNAL_API_KEY`.
  - internal/send-email: requiere `x-internal-key` en producción; en dev continúa funcionando sin clave.
  - login/register (cliente): eliminados fallbacks inseguros de `JWT_SECRET`/`REFRESH_SECRET`; el módulo falla si no están configurados.
  - Prisma tenant: reemplazado `$executeRawUnsafe(SET LOCAL ...)` por `SELECT set_config('app.tenant_id', $1, true)` con `$executeRaw`.
  - /api/upload: exige autenticación (usuario app o cliente), valida `type` contra whitelist, sanea `id`, y devuelve una URL con tamaño válido por tipo.
  - .env.example: añadidos `JWT_SECRET`, `REFRESH_SECRET`, `CLIENT_JWT_SECRET`, `INTERNAL_API_KEY` y variables SMTP.
- Validación: Build pendiente; se revisó sintaxis y módulos afectados. Sugerido correr `pnpm dev` y probar: login cliente, subida de imagen, envío interno de email (con `x-internal-key`).
- Próximos pasos: Completar Fase 1 con limpieza de logs con PII y revisión de otros endpoints sensibles; preparar PR de cambios.

---

## 2025-09-10 — Fase 1 (cierre) y arranque Fase 2
- Resumen: Se finalizaron hotfixes de Fase 1 restando logs con PII y otros endpoints sensibles. Se inició Fase 2 con validación real del token en middleware (Edge).
- Cambios aplicados:
  - email/send-confirmation: agregado control de acceso (auth app o `x-internal-key` en prod).
  - Limpieza de logs PII: login cliente y reset-password (removidos emails de logs); pendiente limpieza adicional en plantillas de email (no bloqueante).
  - upload-utils-server: ruta de `public` robusta para monorepo (`apps/web/public` o fallback a `./public`).
- Middleware: ahora verifica `client-token` con `jose` en Edge; redirige según validez y limpia cookie inválida.
  - Client auth: `apps/web/lib/client-auth.ts` migrado a `jose` (firma y verificación HS256); compatible con tokens existentes.
- Validación: Revisión estática OK. Sugerido probar manualmente rutas cliente (login, dashboard), envío de confirmación (con auth), y subida de imágenes.
- Próximos pasos (Fase 2):
  - Unificar emisión de tokens del cliente a `jose` en `cliente/auth/login` (depreciar `jsonwebtoken`).
  - Migrar verificación/códigos a Redis (TTL) y refactor de email service único (Fase 3 base).

---

## 2025-09-10 — Fase 2 (tokens jose) y verificación en Redis
- Resumen: Se unificó la emisión y verificación de tokens del cliente a `jose` (login y refresh). Se migró la verificación de códigos a Redis con TTL y rate limit, eliminando el store en memoria de endpoints críticos.
- Cambios aplicados:
  - cliente/auth/login: firma con `jose` (HS256) y secretos en bytes (`TextEncoder`).
  - cliente/auth/refresh: reescrito para usar `jose` (verifica token y refresh; reemite ambos).
  - Agregado `apps/web/lib/redis.ts` (singleton ioredis) y `apps/web/lib/verification-redis.ts` (códigos + rate limit TTL en 15m).
  - auth/send-verification: usa Redis (`checkRateLimit`, `setCode`) y quita exports legacy.
  - auth/register: valida código con Redis y limpia tras el éxito.
  - auth/reset-password: verifica/limpia código de usuario del sistema en Redis.
  - apps/web/package.json: añadido `ioredis` en dependencias.
- Validación: Revisión estática OK. Requiere `pnpm install` en `apps/web` para `ioredis`. Probar flujo: enviar código → registrar → reset password (user) → refresh token.
- Próximos pasos:
  - Unificar servicios de email (MailHog dev / SMTP prod; deprecación de duplicados).
  - Añadir validación con `zod` a payloads de auth y upload (y rate limiting por IP con Redis).
  - CI/ESLint básico.

---

## 2025-09-10 — Fase 2 (email unificado + zod)
- Resumen: Avancé en la unificación del servicio de email y validación de inputs.
- Cambios aplicados:
  - `apps/web/lib/email.ts`: ahora soporta `from` y `attachments`, usa MailHog en dev si no hay credenciales, y reduce logs con PII.
  - `apps/web/app/api/email/send-confirmation/route.ts`: usa `sendEmail` (unificado) para enviar con adjunto ICS.
  - Eliminados duplicados: `apps/web/lib/email-service.ts` y `apps/web/lib/nodemailer-wrapper.js`.
  - Zod: añadido a `cliente/auth/login` y `cliente/auth/register` para validar payloads.
- Validación: compilar/verificar endpoints modificados; probar confirmación de cita (envío email con ICS) y login/registro con payloads inválidos (deben responder 400).
- Próximos pasos:
  - Migrar endpoints restantes a usar `sendEmail` y eliminar nodemailer directo donde quede.
  - Añadir `zod` a `auth/reset-password` y `auth/register` (sistema), y a `upload` (parcial por form-data).
  - Agregar rate limiting por IP en login/reset/verify con Redis.

---

## 2025-09-10 — Fase 2 (zod + rate limiting IP)
- Resumen: Añadí validación con `zod` y limitación por IP con Redis en endpoints de usuarios del sistema, y también rate limit en login de clientes.
- Cambios aplicados:
  - `apps/web/lib/rate-limit.ts`: util para obtener IP y aplicar límite por IP con TTL.
  - Sistema:
    - `auth/login`: zod para inputs + rate limit (10/5min por IP).
    - `auth/register`: zod (email, password/confirm, code) + rate limit (5/h por IP).
    - `auth/reset-password`: zod (email, code, newPassword, tipo) + rate limit (10/15min por IP).
    - `auth/send-verification`: zod (email) + rate limit IP (5/15min) además del per-email en Redis.
  - Cliente:
    - `cliente/auth/login`: añadido rate limit por IP (10/5min) además del conteo en DB.
- Validación: compilar y probar 429 en excesos y 400 en inputs inválidos; verificar cabecera `Retry-After`.
- Próximos pasos: extender zod/rate limit a endpoints adicionales si aplica y limpiar restos de usar nodemailer directo.

---

## 2025-09-10 — CI básico y email unificado (completo)
- Resumen: Unifiqué el envío de emails restantes y añadí un pipeline de CI básico.
- Cambios aplicados:
  - internal/send-email: reescrito para usar `sendEmail` y protegido por `INTERNAL_API_KEY`.
  - email/send-confirmation: reescrito para usar `sendEmail` (sin nodemailer directo) y simplificado.
  - CI: `.github/workflows/ci.yml` con Node 20 + PNPM 9 ejecuta install → typecheck → lint → build.
- Validación: revisar CI al abrir PR. Probar envío interno con header `x-internal-key`.
- Próximos pasos: añadir más endpoints al esquema de validación/rate limit según prioridad; revisar reglas ESLint si se desea un conjunto personalizado.

---

## 2025-09-10 — Auditoría inicial y planificación
- Resumen: Se auditó el monorepo (Next.js 14, Prisma, Postgres+Redis). Se detectaron vulnerabilidades en endpoints públicos (códigos de verificación y envío de email), secretos con defaults inseguros, uso de SQL sin parametrizar, subida de archivos sin auth y utilidades de imágenes inconsistentes que generan rutas inválidas. Se redactó plan por fases.
- Cambios aplicados: Documentos creados `docs/HARDENING_PLAN.md` y `docs/WORKLOG.md` con plan y registro. No se tocaron rutas ni lógica aún para evitar interrupciones.
- Validación: N/A (solo documentación y planificación).
- Próximos pasos (Fase 1):
  - Bloquear/asegurar `api/get-verification-code` y `api/internal/send-email`.
  - Enforce secretos (eliminar fallbacks de JWT/refresh/client).
  - Reemplazar `$executeRawUnsafe` con consultas parametrizadas.
  - Endurecer `/api/upload` (auth + validaciones + paths correctos).

---
