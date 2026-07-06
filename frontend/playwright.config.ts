import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './e2e/tests',
    timeout: 30_000,
    expect: { timeout: 5000 },
    fullyParallel: true,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
        headless: true,
        viewport: { width: 1280, height: 800 },
        actionTimeout: 10000,
        ignoreHTTPSErrors: true,
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
})
