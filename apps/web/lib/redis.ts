import Redis from 'ioredis'

declare global {
  // eslint-disable-next-line no-var
  var __redis__: Redis | undefined
}

export function getRedis(): Redis {
  if (!global.__redis__) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379'
    global.__redis__ = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    })
  }
  return global.__redis__
}

