import { test, expect } from '@playwright/test'

test.describe('Student AI Platform smoke', () => {
    test('home loads the student workspace', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByText('Your AI Career Operating System')).toBeVisible({ timeout: 10000 })
    })

    test('core student routes render', async ({ page }) => {
        for (const route of ['/chat', '/career-roadmap', '/projects', '/resume', '/mentor', '/knowledge', '/workflows', '/analytics', '/settings']) {
            await page.goto(route)
            await expect(page.locator('main')).toBeVisible()
        }
    })
})
