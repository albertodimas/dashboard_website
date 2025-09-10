import { test, expect, request } from '@playwright/test'

async function isUp(baseURL: string) {
  try {
    const ctx = await request.newContext({ baseURL })
    const resp = await ctx.get('/')
    await ctx.dispose()
    return resp.ok() || resp.status() < 500
  } catch {
    return false
  }
}

test.describe('API smoke', () => {
  test.beforeAll(async ({}) => {
    const ok = await isUp(process.env.BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000')
    test.skip(!ok, 'Server not reachable at BASE_URL')
  })

  test('public packages list query validates and responds', async ({ request, baseURL }) => {
    const url = `${baseURL}/api/public/packages?business=test-slug`
    const resp = await request.get(url)
    expect(resp.status()).toBeLessThan(500)
  })

  test('slots endpoint validates query', async ({ request, baseURL }) => {
    const url = `${baseURL}/api/public/appointments/slots?businessId=not-a-uuid&serviceId=not-a-uuid&date=2025-01-01`
    const resp = await request.get(url)
    expect([400, 422]).toContain(resp.status())
  })
})

