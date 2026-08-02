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
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'Active sessions' }),
    ).toBeVisible()
    const sessionsRegion = page.getByRole('list', { name: 'Active sessions' }).or(
      page.getByRole('region', { name: 'Active sessions' }),
    )
    const checkout = sessionsRegion.getByRole('link', { name: 'Checkout' })
    const emptyState = page.getByText('No sessions need attention.')
    await expect(checkout.or(emptyState).first()).toBeVisible({ timeout: 30_000 })
  })
})
