import { getRedis } from './redis'

const CODE_PREFIX = 'verify:code:'
const DATA_PREFIX = 'verify:data:'
const ATTEMPTS_PREFIX = 'verify:attempts:'
const DEFAULT_TTL_SECONDS = 15 * 60 // 15 minutes

export async function checkRateLimit(email: string): Promise<{ allowed: boolean; minutesLeft?: number }> {
  const redis = getRedis()
  const attemptsKey = ATTEMPTS_PREFIX + email.toLowerCase()
  const attemptsStr = await redis.get(attemptsKey)
  const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0
  if (attempts >= 3) {
    const ttl = await redis.ttl(attemptsKey)
    const minutesLeft = ttl > 0 ? Math.ceil(ttl / 60) : 1
    return { allowed: false, minutesLeft }
  }
  return { allowed: true }
}

export async function setCode(email: string, code: string, ttlSeconds: number = DEFAULT_TTL_SECONDS, data?: unknown): Promise<void> {
  const redis = getRedis()
  const key = CODE_PREFIX + email.toLowerCase()
  const attemptsKey = ATTEMPTS_PREFIX + email.toLowerCase()
  // Set code with TTL
  await redis.set(key, code, 'EX', ttlSeconds)
  // Optionally store associated data with same TTL
  if (typeof data !== 'undefined') {
    const dataKey = DATA_PREFIX + email.toLowerCase()
    await redis.set(dataKey, JSON.stringify(data), 'EX', ttlSeconds)
  }
  // Increment attempts and align TTL
  const attempts = await redis.incr(attemptsKey)
  if (attempts === 1) {
    await redis.expire(attemptsKey, ttlSeconds)
  }
}

export async function getCode(email: string): Promise<string | null> {
  const redis = getRedis()
  const key = CODE_PREFIX + email.toLowerCase()
  return redis.get(key)
}

export async function getData<T = any>(email: string): Promise<T | null> {
  const redis = getRedis()
  const key = DATA_PREFIX + email.toLowerCase()
  const raw = await redis.get(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const stored = await getCode(email)
  return !!stored && stored === code
}

export async function clearCode(email: string): Promise<void> {
  const redis = getRedis()
  await redis.del(CODE_PREFIX + email.toLowerCase())
  await redis.del(DATA_PREFIX + email.toLowerCase())
  await redis.del(ATTEMPTS_PREFIX + email.toLowerCase())
}
