import { expect, test, type Page } from '@playwright/test'

const staffEmail = 'staff@eparkgo.local'
const staffPassword = 'Staff123!@#'

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(staffEmail)
  await page.getByLabel('Password', { exact: true }).fill(staffPassword)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 60_000 })
}

async function openShift(page: Page) {
  await page.goto('/shifts')
  const startButton = page.getByRole('button', { name: 'Start shift' })
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click()
    await expect(page.getByText(/Shift opened/i)).toBeVisible({ timeout: 30_000 })
  }
}

async function createEntry(page: Page, plate: string) {
  await page.goto('/entry')
  await page.getByLabel('Plate number').fill(plate)
  await page.getByLabel('Vehicle type').selectOption({ label: 'Car' })
  const spaceSelect = page.getByLabel('Parking space')
  const value = await spaceSelect.locator('option:not([value=""])').first().getAttribute('value')
  if (!value) {
    throw new Error('No available parking spaces for payment E2E')
  }
  await spaceSelect.selectOption(value)
  await page.getByRole('button', { name: 'Create entry and issue ticket' }).click()
  await page.waitForURL(/\/tickets\/.*issued=1/, { timeout: 60_000 })
}

test.describe('Phase 8 payment and confirmed exit flows', () => {
  test.describe.configure({ mode: 'serial' })

  test('grace-period session completes without duplicate payment', async ({ page }, testInfo) => {
    test.setTimeout(180_000)
    await signIn(page)
    await openShift(page)

    const plate = `P8${testInfo.project.name.slice(0, 2)}${Date.now().toString().slice(-5)}`
    await createEntry(page, plate)

    const ticketHeading = page.getByRole('heading', { name: /^EPG-/ })
    const ticketNumber = (await ticketHeading.textContent())?.trim()
    expect(ticketNumber).toBeTruthy()

    await page.goto('/scanner')
    await page.getByLabel('Ticket number').fill(ticketNumber ?? '')
    await page.getByRole('button', { name: 'Look up ticket' }).click()
    await page.waitForURL(/\/exit\//, { timeout: 60_000 })
    await page.getByRole('button', { name: 'Calculate exit preview' }).click()
    await expect(page.getByRole('link', { name: 'Continue to exit confirmation' })).toBeVisible({
      timeout: 60_000,
    })
    await page.getByRole('link', { name: 'Continue to exit confirmation' }).click()
    await page.getByRole('button', { name: 'Confirm exit and release space' }).click()
    await expect(page.getByText('Exit completed')).toBeVisible({ timeout: 60_000 })
  })
})
