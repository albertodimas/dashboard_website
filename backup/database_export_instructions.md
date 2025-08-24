# Database Backup Instructions

## Para hacer backup completo de la base de datos PostgreSQL:

### Opción 1: Usar pgAdmin (Recomendado)
1. Abrir pgAdmin
2. Conectar al servidor localhost
3. Click derecho en la base de datos "dashboard"
4. Seleccionar "Backup..."
5. Guardar el archivo .sql en la carpeta backup/

### Opción 2: Usar línea de comandos (si pg_dump está disponible)
```bash
pg_dump -h localhost -U dashboard -d dashboard > backup/database_backup.sql
```

### Opción 3: Exportar desde la aplicación
```bash
cd packages/db
pnpm prisma db pull
pnpm prisma generate
```

## Archivos ya respaldados:
- ✅ schema.prisma - Estructura de la base de datos
- ✅ Carpeta backup/ creada

## Para restaurar:
1. Crear nueva base de datos
2. Ejecutar el archivo .sql backup
3. Ejecutar `pnpm prisma generate`