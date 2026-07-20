import { expect, test } from '@playwright/test'

test.describe('Landing page reference surface', () => {
  test('renders the complete light and dark marketing compositions', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: 'light' })

    const response = await page.goto('/')

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('img', { name: 'E-ParkGO' }).first()).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Smarter parking from entry to exit.' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'How E-ParkGO Works' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Powerful Features/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Trusted by Parking Operators/ })).toBeVisible()

    await page.screenshot({
      path: `test-results/landing-${testInfo.project.name}-light.png`,
      fullPage: true,
    })

    await page.getByRole('button', { name: 'Use dark theme' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('button', { name: 'Use light theme' })).toBeVisible()

    await page.screenshot({
      path: `test-results/landing-${testInfo.project.name}-dark.png`,
      fullPage: true,
    })
  })

  test('stays usable without horizontal overflow on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Smarter parking from entry to exit.' }),
    ).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
