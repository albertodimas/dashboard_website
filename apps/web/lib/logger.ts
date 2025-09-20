/* eslint-disable no-console */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const MASK_KEYS = new Set(['password', 'token', 'code', 'email'])

function maskValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (!MASK_KEYS.has(key)) return value
  if (key === 'email' && typeof value === 'string') {
    const [user, domain] = value.split('@')
    const safeUser = user ? user.slice(0, 2) + '***' : '***'
    return domain ? `${safeUser}@${domain}` : `${safeUser}`
  }
  if (typeof value === 'string') return '***'
  return '***'
}

function sanitize(input: unknown, depth = 0): unknown {
  if (depth > 4) return '[Truncated]'
  if (Array.isArray(input)) return input.map((v) => sanitize(v, depth + 1))
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = maskValue(k, v)
    }
    return out
  }
  return input
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function buildContext(args: unknown[]): Record<string, unknown> | undefined {
  if (!args.length) return undefined
  if (args.length === 1) {
    const [single] = args
    if (single instanceof Error) {
      return { error: sanitize({ message: single.message, stack: single.stack }) as Record<string, unknown> }
    }
    if (isPlainObject(single)) {
      return sanitize(single) as Record<string, unknown>
    }
    return { data: sanitize(single) }
  }

  return {
    data: sanitize(args),
  }
}

function log(level: LogLevel, msg: string, ...args: unknown[]) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg,
    ctx: buildContext(args),
    env: process.env.NODE_ENV,
  }
  const line = JSON.stringify(payload)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else if (level === 'debug') {
    if (process.env.LOG_LEVEL === 'debug') console.debug(line)
  } else console.log(line)
}

export const logger = {
  debug: (msg: string, ...args: unknown[]) => log('debug', msg, ...args),
  info: (msg: string, ...args: unknown[]) => log('info', msg, ...args),
  warn: (msg: string, ...args: unknown[]) => log('warn', msg, ...args),
  error: (msg: string, ...args: unknown[]) => log('error', msg, ...args),
}

