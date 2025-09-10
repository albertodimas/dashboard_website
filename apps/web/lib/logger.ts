type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const MASK_KEYS = new Set(['password', 'token', 'code', 'email'])

function maskValue(key: string, value: unknown): unknown {
  if (value == null) return value
  if (!MASK_KEYS.has(key)) return value
  if (key === 'email' && typeof value === 'string') {
    const [user, domain] = value.split('@')
    const safeUser = user ? user.slice(0, 2) + '***' : '***'
    return domain ? `${safeUser}@${domain}` : `${safeUser}`
  }
  if (typeof value === 'string') return '***'
  return '***'
}

function sanitize(input: any, depth = 0): any {
  if (depth > 4) return '[Truncated]'
  if (Array.isArray(input)) return input.map((v) => sanitize(v, depth + 1))
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input)) {
      out[k] = maskValue(k, v)
    }
    return out
  }
  return input
}

function log(level: LogLevel, msg: string, ctx?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg,
    ctx: ctx ? sanitize(ctx) : undefined,
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
  debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
}

