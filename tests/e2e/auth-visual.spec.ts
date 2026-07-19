import { expect, test } from '@playwright/test'

test.describe('Phase 4 authentication surface', () => {
  test('matches the branded desktop login composition', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 844 })
    const response = await page.goto('/login')

    expect(response?.status()).toBe(200)
    expect(response?.headers()['content-security-policy']).toContain("script-src 'self' 'nonce-")
    await expect(page.getByRole('img', { name: 'E-ParkGO' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Smarter parking from entry to exit.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Use dark theme' })).toBeVisible()

    await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true })
  })

  test('keeps the auth card usable without horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)

    await page.screenshot({ path: 'test-results/login-mobile.png', fullPage: true })
  })
})
