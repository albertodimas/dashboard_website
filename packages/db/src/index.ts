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
  await prisma.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`)
}

export async function withTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`)
    return await fn()
  })
}