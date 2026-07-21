import { expect, test, type Page } from '@playwright/test'

const adminEmail = 'admin@eparkgo.local'
const adminPassword = 'Admin123!@#'

async function signInAdmin(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(adminEmail)
  await page.getByLabel('Password', { exact: true }).fill(adminPassword)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 60_000 })
}

test.describe('Phase 8 exception workflows', () => {
  test('sessions page lists operational exception states', async ({ page }) => {
    test.setTimeout(120_000)
    await signInAdmin(page)
    await page.goto('/sessions')
    await expect(page.getByRole('heading', { name: 'Active & exception sessions' })).toBeVisible()
    const exitPreview = page.getByRole('link', { name: 'Exit preview' })
    const emptyState = page.getByText('No exception sessions right now')
    await expect(exitPreview.or(emptyState).first()).toBeVisible()
  })
})
