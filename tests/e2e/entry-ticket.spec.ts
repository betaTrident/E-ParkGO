import { expect, test, type Page } from '@playwright/test'

const staffEmail = 'staff@eparkgo.local'
const staffPassword = 'Staff123!@#'

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 60_000 })
}

async function selectFirstAvailableSpace(page: Page) {
  const spaceSelect = page.getByLabel('Parking space')
  const firstSpace = spaceSelect.locator('option:not([value=""])').first()
  await expect(firstSpace).toBeAttached({ timeout: 30_000 })
  const value = await firstSpace.getAttribute('value')
  if (!value) {
    throw new Error('No available parking spaces for entry E2E')
  }
  await spaceSelect.selectOption(value)
}

async function createEntry(page: Page, plate: string) {
  await page.goto('/entry')
  await expect(page.getByRole('heading', { name: 'Vehicle entry' })).toBeVisible()
  await page.getByLabel('Plate number').fill(plate)
  await page.getByLabel('Vehicle type').selectOption({ label: 'Car' })
  await selectFirstAvailableSpace(page)
  await page.getByRole('button', { name: 'Create entry and issue ticket' }).click()
  await page.waitForURL(/\/tickets\/.*issued=1/, { timeout: 60_000 })
}

test.describe('Phase 6 entry and ticket flows', () => {
  test.describe.configure({ mode: 'serial' })

  test('staff can create an entry and view printable ticket', async ({ page }, testInfo) => {
    test.setTimeout(120_000)
    await signIn(page, staffEmail, staffPassword)

    const plate = `E2E${testInfo.project.name.slice(0, 2)}${Date.now().toString().slice(-5)}`
    await createEntry(page, plate)

    await expect(page.getByRole('heading', { name: /^EPG-/ })).toBeVisible()
    await expect(page.getByLabel(/QR code for ticket/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Print ticket' })).toBeEnabled()

    const storageKeys = await page.evaluate(() => Object.keys(localStorage))
    expect(storageKeys.some((key) => key.includes('ticket'))).toBe(false)
  })

  test('ticket page shows reissue guidance after leaving without credential', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000)
    await signIn(page, staffEmail, staffPassword)

    const plate = `RIS${testInfo.project.name.slice(0, 2)}${Date.now().toString().slice(-5)}`
    await createEntry(page, plate)

    const ticketUrl = page.url()
    await page.goto('/dashboard')
    await page.goto(ticketUrl.split('?')[0] ?? ticketUrl)

    await expect(
      page.getByText(/one-time qr credential is no longer available/i),
    ).toBeVisible()
  })
})
