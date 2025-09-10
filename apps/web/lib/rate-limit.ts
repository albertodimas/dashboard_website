import type { NextRequest } from 'next/server'
import { getRedis } from './redis'

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    '127.0.0.1'
  )
}

export async function limitByIP(ip: string, bucket: string, limit: number, windowSec: number): Promise<{
  allowed: boolean
  remaining?: number
  retryAfterSec?: number
}> {
  const redis = getRedis()
  const key = `ratelimit:${bucket}:${ip}`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, windowSec)
  }
  const ttl = await redis.ttl(key)
  if (count > limit) {
    return { allowed: false, retryAfterSec: ttl > 0 ? ttl : windowSec }
  }
  return { allowed: true, remaining: Math.max(0, limit - count) }
}

