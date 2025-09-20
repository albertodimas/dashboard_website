import IORedis from 'ioredis'

type RedisClient = InstanceType<typeof IORedis>

declare global {
  // eslint-disable-next-line no-var
  var __redis__: RedisClient | undefined
}

export function getRedis(): RedisClient {
  if (!globalThis.__redis__) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379'
    globalThis.__redis__ = new IORedis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    })
  }
  return globalThis.__redis__
}
