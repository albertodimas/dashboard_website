# Security Hardening & Improvements Plan

Objetivo: corregir vulnerabilidades y mejorar la calidad sin romper funcionalidades existentes. El trabajo se divide por fases con criterios de aceptación claros y priorización de impacto/riesgo.

## Fase 1 — Hotfixes críticos
- Bloquear o eliminar `apps/web/app/api/get-verification-code/route.ts` (no exponer códigos activos).
- Restringir `apps/web/app/api/internal/send-email/route.ts` (auth/roles o eliminar).
- Enforce secretos: eliminar fallbacks para `JWT_SECRET`, `REFRESH_SECRET`, `CLIENT_JWT_SECRET` (fallar rápido si faltan).
- Sustituir `$executeRawUnsafe` por consultas parametrizadas en `packages/db/src/index.ts`.
- Endurecer `/api/upload`: requerir auth, validar `type` whitelist, sanear `id`, límites de tamaño/mime real, y corregir `url` devuelta según tamaños válidos.

Aceptación F1:
- Los endpoints sensibles exigen autorización o no existen.
- El arranque falla si faltan secretos requeridos.
- No hay interpolación de SQL sin parámetros.
- Subidas solo para usuarios válidos y con validaciones completas.

## Fase 2 — Autenticación y sesiones
- Middleware (Edge) valida `client-token` con `jose` (sin depender de Node APIs).
- Unificar tokens en `jose` (depreciar `jsonwebtoken` en cliente) manteniendo compatibilidad.
- Cookies `httpOnly`, `secure`, `sameSite=strict` donde aplique; revisitar expiraciones.

Aceptación F2:
- Rutas protegidas redirigen correctamente con tokens inválidos/expirados.
- Un solo stack de JWT documentado.

## Fase 3 — Email y códigos de verificación
- Centralizar envío de email en un módulo único (MailHog en dev, SMTP/env en prod, Ethereal opcional para demo).
- Migrar verification store a Redis con TTL y contador de intentos por email.

Aceptación F3:
- Códigos expiran por TTL en Redis; rate limit efectivo.
- No hay duplicación de servicios de email.

## Fase 4 — Imágenes y almacenamiento
- Unificar utilidades de imágenes (server-only) y la ruta base (sanitizada) hacia `apps/web/public/<folder>`.
- Sanitizar `id`/`type`; añadir prueba de humo que verifica la ruta final y limpieza.
- Limpiar directorios residuales creados por paths inválidos.

Aceptación F4:
- Las imágenes se escriben solo bajo `apps/web/public` y se sirven correctamente.
- No se crean rutas extrañas en la raíz.

## Fase 5 — Validación y limitación
- Añadir `zod` a inputs de endpoints críticos (auth, registro, upload, bookings) con mensajes consistentes.
- Rate limiting central (Redis) para login/reset/verify/upload.

Aceptación F5:
- Peticiones inválidas retornan 400 con errores claros.
- Límite de peticiones activo y testeado.

## Fase 6 — Observabilidad, calidad y CI
- Inicializar Sentry (server/client) y logs estructurados sin PII en producción.
- ESLint/Prettier root y pipeline de CI (install → lint → typecheck → build → tests).

Aceptación F6:
- CI en verde; estilo consistente.
- Errores capturados en Sentry en entornos configurados.

## Fase 7 — Tests
- Unit tests de utilidades (auth, imágenes, validación).
- 1–2 E2E básicas (login cliente, flujo feliz de reserva si aplica).

Aceptación F7:
- Tests corren local/CI y cubren caminos críticos.

## Seguimiento
- Mantener `docs/WORKLOG.md` por sesión con: resumen, cambios aplicados, validación y próximos pasos.

