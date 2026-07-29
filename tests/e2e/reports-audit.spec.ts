import { expect, test, type Page } from '@playwright/test'

const staffEmail = 'staff@eparkgo.local'
const staffPassword = 'Staff123!@#'
const adminEmail = 'admin@eparkgo.local'
const adminPassword = 'Admin123!@#'

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 60_000 })
}

test.describe('reports and audit', () => {
  test('staff can open transactions and reports surfaces', async ({ page }) => {
    await signIn(page, staffEmail, staffPassword)

    await page.goto('/transactions')
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Search transactions' })).toBeVisible()

    await page.goto('/reports')
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
    await page.getByRole('button', { name: 'Preview report' }).click()
    await expect(page.getByRole('region', { name: /summary/i })).toBeVisible({ timeout: 30_000 })
  })

  test('staff cannot export reports or open audit viewer', async ({ page }) => {
    await signIn(page, staffEmail, staffPassword)

    await page.goto('/reports')
    await expect(page.getByRole('button', { name: 'Export CSV' })).toHaveCount(0)

    await page.goto('/admin/audit')
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 })
  })

  test('admin can export CSV and search audit logs', async ({ page }) => {
    await signIn(page, adminEmail, adminPassword)

    await page.goto('/reports')
    await page.getByRole('button', { name: 'Preview report' }).click()
    await expect(page.getByRole('region', { name: /summary/i })).toBeVisible({ timeout: 30_000 })

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export CSV' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.csv$/i)

    await page.goto('/admin/audit')
    await expect(page.getByRole('heading', { name: 'Audit log' })).toBeVisible()
    await page.getByRole('button', { name: 'Search audit logs' }).click()
    await expect(page.getByRole('button', { name: 'View details' }).first()).toBeVisible({
      timeout: 30_000,
    })
  })

  test('shift history panel is visible', async ({ page }) => {
    await signIn(page, staffEmail, staffPassword)
    await page.goto('/shifts')
    await expect(page.getByRole('heading', { name: 'Shift history' })).toBeVisible()
  })
})
