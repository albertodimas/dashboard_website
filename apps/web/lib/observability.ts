import { logger } from './logger'

let sentry: any = null
let sentryInited = false

const dynamicRequire: NodeRequire | null = (() => {
  try {
    return (Function('return typeof require !== "undefined" ? require : null') as () => NodeRequire | null)()
  } catch (error) {
    logger.debug('Dynamic require unavailable for Sentry', {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
})()

function resolveSentryModule(): any | null {
  if (!dynamicRequire) {
    return null
  }

  const candidates = ['@sentry/nextjs', '@sentry/node']
  for (const name of candidates) {
    try {
      return dynamicRequire(name)
    } catch (error) {
      logger.debug('Sentry module not found', {
        module: name,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return null
}

export function initObservability() {
  if (sentryInited) return
  sentryInited = true
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    logger.debug('Skipping Sentry init - missing DSN')
    return
  }

  const mod = resolveSentryModule()
  if (!mod || typeof mod.init !== 'function') {
    logger.warn('Sentry SDK not installed, continuing without it')
    return
  }

  try {
    mod.init({
      dsn,
      environment: process.env.SENTRY_ENV || process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0'),
      profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0'),
    })
    sentry = mod
    logger.info('Sentry initialized')
  } catch (error) {
    logger.warn('Sentry initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export function trackError(error: unknown, context?: Record<string, unknown>) {
  logger.error('Unhandled error', { error: error instanceof Error ? error.message : String(error), ...context })
  if (!sentryInited) initObservability()
  if (sentry && typeof sentry.captureException === 'function') {
    try {
      sentry.captureException(error, { extra: context })
    } catch (captureError) {
      logger.debug('Sentry capture failed', {
        error: captureError instanceof Error ? captureError.message : String(captureError),
      })
    }
  }
}

