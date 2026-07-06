import { test, expect } from '@playwright/test'

test.describe('Student AI Platform smoke', () => {
    test('home loads the student workspace', async ({ page }) => {
        await page.goto('/')
        await expect(page.locator('#main-content')).toBeVisible()
        await expect(page.getByRole('heading', { name: /Your AI Workspace for Learning/i })).toBeVisible({ timeout: 10000 })
    })

    test('core student routes render', async ({ page }) => {
        for (const route of ['/chat', '/career-roadmap', '/projects', '/resume', '/mentor', '/knowledge', '/workflows', '/analytics', '/settings']) {
            await page.goto(route)
            await expect(page.locator('#main-content')).toBeVisible()
        }
    })

    test('home layout is responsive without horizontal overflow', async ({ page }) => {
        for (const viewport of [
            { width: 390, height: 844 },
            { width: 768, height: 1024 },
            { width: 1440, height: 900 },
        ]) {
            await page.setViewportSize(viewport)
            await page.goto('/')
            await expect(page.getByRole('heading', { name: /Your AI Workspace for Learning/i })).toBeVisible()

            const hasNoHorizontalOverflow = await page.evaluate(() => (
                document.documentElement.scrollWidth <= window.innerWidth + 1
            ))

            expect(hasNoHorizontalOverflow).toBeTruthy()
        }
    })
})
