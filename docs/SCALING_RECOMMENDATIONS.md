# Recomendaciones de Escalabilidad para 200+ Tenants

## 1. Optimizaciones de Base de Datos

### Índices Adicionales Recomendados
```sql
-- Índice compuesto para queries frecuentes
CREATE INDEX idx_appointments_tenant_status_date 
ON appointments(tenantId, status, startTime);

-- Índice para reportes
CREATE INDEX idx_appointments_tenant_business_date 
ON appointments(tenantId, businessId, startTime);

-- Índice para búsqueda de clientes
CREATE INDEX idx_customers_tenant_name 
ON customers(tenantId, name);
```

### Particionamiento (Opcional para 500+ tenants)
```sql
-- Particionar appointments por fecha (mensual)
CREATE TABLE appointments_2024_01 PARTITION OF appointments
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## 2. Optimizaciones de Aplicación

### Cache Strategy
```typescript
// Implementar Redis para cache
const CACHE_TTL = {
  business_info: 3600,      // 1 hora
  services: 1800,            // 30 minutos
  working_hours: 86400,      // 24 horas
  reports: 300,              // 5 minutos
}

// Ejemplo de implementación
async function getBusinessInfo(businessId: string) {
  const cached = await redis.get(`business:${businessId}`)
  if (cached) return JSON.parse(cached)
  
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  })
  
  await redis.setex(
    `business:${businessId}`, 
    CACHE_TTL.business_info, 
    JSON.stringify(business)
  )
  
  return business
}
```

### Query Optimization
```typescript
// SIEMPRE filtrar por tenantId primero
const appointments = await prisma.appointment.findMany({
  where: {
    tenantId: tenantId,  // Siempre primero
    businessId: businessId,
    startTime: {
      gte: startDate,
      lte: endDate
    }
  },
  include: {
    customer: true,
    service: true
  }
})
```

## 3. Monitoreo Recomendado

### Métricas Clave
- **Query time**: Ninguna query debe tardar >100ms
- **Conexiones DB**: Mantener pool en 20-50 conexiones
- **Memory usage**: <70% del disponible
- **Disk I/O**: Monitorear picos

### Herramientas
- **pg_stat_statements**: Para identificar queries lentas
- **pgBadger**: Análisis de logs
- **Grafana + Prometheus**: Dashboard de métricas

## 4. Límites Recomendados por Tenant

```typescript
const TENANT_LIMITS = {
  max_appointments_per_day: 500,
  max_customers: 10000,
  max_services: 100,
  max_staff: 50,
  api_rate_limit: 1000, // requests per hour
}
```

## 5. Arquitectura para 500+ Tenants

Si creces más allá de 500 tenants, considera:

### Opción A: Read Replicas
```
┌─────────────┐
│  Primary DB │ ← Writes
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│Read1│ │Read2│ ← Reads (Reports, Queries)
└─────┘ └─────┘
```

### Opción B: Sharding por TenantId
```
Tenants 1-100    → DB1
Tenants 101-200  → DB2
Tenants 201-300  → DB3
```

## 6. Seguridad Adicional

### Row Level Security (RLS)
```sql
-- Activar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Política de seguridad
CREATE POLICY tenant_isolation ON appointments
FOR ALL
USING (tenantId = current_setting('app.current_tenant')::uuid);
```

### API Rate Limiting
```typescript
// Implementar rate limiting por tenant
const rateLimiter = new RateLimiter({
  points: 1000,    // requests
  duration: 3600,  // per hour
  keyPrefix: 'tenant',
})

middleware: async (req, res, next) => {
  try {
    await rateLimiter.consume(req.tenantId)
    next()
  } catch {
    res.status(429).send('Too Many Requests')
  }
}
```

## 7. Backup Strategy

Para 200 tenants:
- **Backup completo**: Diario a las 2 AM
- **Backup incremental**: Cada 4 horas
- **Point-in-time recovery**: Últimas 7 días
- **Backup offsite**: S3 o similar

## 8. Estimación de Recursos

### Para 200 Tenants Activos:
- **CPU**: 4-8 cores
- **RAM**: 16-32 GB
- **Disk**: 500 GB SSD (con crecimiento)
- **PostgreSQL**: v14+ con configuración optimizada
- **Redis**: 4 GB para cache

### Configuración PostgreSQL Recomendada:
```ini
# postgresql.conf
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
```

## Conclusión

El modelo actual es **perfectamente adecuado** para 200 tenants y puede escalar hasta 500-1000 tenants con optimizaciones menores. La clave está en:

1. Mantener índices optimizados
2. Implementar cache estratégico
3. Monitorear proactivamente
4. Planificar el crecimiento

Con estas optimizaciones, el sistema puede manejar:
- **10,000+ citas por día**
- **100,000+ clientes totales**
- **Sub-segundo response time**
- **99.9% uptime**