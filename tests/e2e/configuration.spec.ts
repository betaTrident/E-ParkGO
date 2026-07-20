import { expect, test } from '@playwright/test'

const adminEmail = 'admin@eparkgo.local'
const adminPassword = 'Admin123!@#'
const staffEmail = 'staff@eparkgo.local'
const staffPassword = 'Staff123!@#'

async function signIn(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 60_000 })
}

test.describe('Phase 5 configuration flows', () => {
  test.describe.configure({ mode: 'serial' })

  test('admin can open spaces, settings, and rates pages', async ({ page }) => {
    test.setTimeout(90_000)
    await signIn(page, adminEmail, adminPassword)

    await page.goto('/spaces')
    await expect(page.getByRole('heading', { name: 'Parking spaces' })).toBeVisible()
    await expect(page.getByText('A-01')).toBeVisible()

    await page.goto('/admin/settings')
    await expect(page.getByRole('heading', { name: 'Facility settings' })).toBeVisible()
    await expect(page.getByLabel('Facility name')).toHaveValue('E-ParkGO Pilot Facility')

    await page.goto('/admin/rates')
    await expect(page.getByRole('heading', { name: 'Rates' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create rate draft' })).toBeVisible()
  })

  test('staff can view spaces but not admin configuration pages', async ({ page }) => {
    test.setTimeout(90_000)
    await signIn(page, staffEmail, staffPassword)

    await page.goto('/spaces')
    await expect(page.getByRole('heading', { name: 'Parking spaces' })).toBeVisible()

    await page.goto('/admin/settings')
    await expect(page).toHaveURL(/\/dashboard$/)

    await page.goto('/admin/rates')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('spaces board is usable on a narrow viewport', async ({ page }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: 360, height: 740 })
    await signIn(page, staffEmail, staffPassword)

    await page.goto('/spaces')
    await expect(page.getByLabel('Zone')).toBeVisible()
    await expect(page.getByLabel('Status')).toBeVisible()
    await expect(page.getByText('A-01')).toBeVisible()
  })
})
