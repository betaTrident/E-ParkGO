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
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/dashboard'),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ])
}

test.describe('Phase 4 live authentication', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('allows an admin to sign in and open staff management', async ({ page }) => {
    await signIn(page, adminEmail, adminPassword)

    await page.goto('/admin/staff')
    await expect(page).toHaveURL(/\/admin\/staff$/)
    await expect(page.getByRole('heading', { name: /Staff & users/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Invite staff' })).toBeVisible()
  })

  test('denies ordinary staff access to admin staff management', async ({ page }) => {
    await signIn(page, staffEmail, staffPassword)

    await page.goto('/admin/staff')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('redirects unauthenticated users to login with a safe next path', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/)
  })

  test('signs out and returns to the login page', async ({ page }) => {
    await signIn(page, adminEmail, adminPassword)

    await page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Sign out' }) })
      .evaluate((form) => {
        ;(form as HTMLFormElement).requestSubmit()
      })
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('exposes the forgot-password recovery entry point', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL(/\/forgot-password/)
    await expect(page.getByLabel('Email address')).toBeVisible()
  })
})
