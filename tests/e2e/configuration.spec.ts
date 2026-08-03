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

  test('admin can open settings and rates; spaces redirects to capacity pools', async ({ page }) => {
    test.setTimeout(90_000)
    await signIn(page, adminEmail, adminPassword)

    await page.goto('/spaces')
    await expect(page).toHaveURL(/\/admin\/settings$/)
    await expect(page.getByRole('heading', { name: 'Facility settings' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Capacity pools' })).toBeVisible()
    await expect(page.getByLabel('Car capacity')).toBeVisible()

    await page.goto('/admin/rates')
    await expect(page.getByRole('heading', { name: 'Rates' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create rate draft' })).toBeVisible()
  })

  test('staff is redirected from spaces and cannot open admin configuration pages', async ({ page }) => {
    test.setTimeout(90_000)
    await signIn(page, staffEmail, staffPassword)

    await page.goto('/spaces')
    await expect(page).toHaveURL(/\/dashboard$/)

    await page.goto('/admin/settings')
    await expect(page).toHaveURL(/\/dashboard$/)

    await page.goto('/admin/rates')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('facility settings capacity section is usable on a narrow viewport', async ({ page }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: 360, height: 740 })
    await signIn(page, adminEmail, adminPassword)

    await page.goto('/admin/settings')
    await expect(page.getByRole('heading', { name: 'Capacity pools' })).toBeVisible()
    await expect(page.getByLabel('Car capacity')).toBeVisible()
    await expect(page.getByLabel('Motorcycle capacity')).toBeVisible()
  })
})
