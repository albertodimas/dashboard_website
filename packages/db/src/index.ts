import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from '@prisma/client'

export async function setTenantId(tenantId: string) {
  // Use set_config to avoid raw string interpolation and support parameter binding
  await prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`
}

export async function withTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`
    return await fn()
  })
}
