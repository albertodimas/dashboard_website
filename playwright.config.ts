import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './apps/web/tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000',
  },
  reporter: [['list']]
})

