import { logger } from './logger'

let sentry: any = null
let sentryInited = false

export function initObservability() {
  if (sentryInited) return
  sentryInited = true
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  try {
    // Prefer @sentry/nextjs if present, fallback to @sentry/node
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = (require as any)('@sentry/nextjs') || (require as any)('@sentry/node')
    mod.init({
      dsn,
      environment: process.env.SENTRY_ENV || process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0'),
      profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0'),
    })
    sentry = mod
    logger.info('Sentry initialized')
  } catch (e) {
    logger.warn('Sentry not available, continuing without it')
  }
}

export function trackError(error: unknown, context?: Record<string, unknown>) {
  logger.error('Unhandled error', { error: error instanceof Error ? error.message : String(error), ...context })
  if (!sentryInited) initObservability()
  if (sentry && typeof sentry.captureException === 'function') {
    try {
      sentry.captureException(error, { extra: context })
    } catch (e) {
      // swallow
    }
  }
}

