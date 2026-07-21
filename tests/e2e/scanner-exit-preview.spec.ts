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

async function createEntry(page: Page, plate: string) {
  await page.goto('/entry')
  await expect(page.getByRole('heading', { name: 'Vehicle entry' })).toBeVisible()
  await page.getByLabel('Plate number').fill(plate)
  await page.getByLabel('Vehicle type').selectOption({ label: 'Car' })

  const spaceSelect = page.getByLabel('Parking space')
  const options = spaceSelect.locator('option:not([value=""])')
  const optionCount = await options.count()

  if (optionCount === 0) {
    throw new Error('No available parking spaces for scanner E2E')
  }

  for (let index = 0; index < optionCount; index += 1) {
    const value = await options.nth(index).getAttribute('value')
    if (!value) {
      continue
    }

    await spaceSelect.selectOption(value)
    await page.getByRole('button', { name: 'Create entry and issue ticket' }).click()

    try {
      await page.waitForURL(/\/tickets\/.*issued=1/, { timeout: 20_000 })
      return
    } catch {
      const spaceUnavailable = page.getByText(/selected space is not available/i)
      if (await spaceUnavailable.isVisible().catch(() => false)) {
        await page.goto('/entry')
        await page.getByLabel('Plate number').fill(plate)
        await page.getByLabel('Vehicle type').selectOption({ label: 'Car' })
        continue
      }

      throw new Error('Entry creation failed without a recoverable space conflict')
    }
  }

  throw new Error('Exhausted available parking spaces for scanner E2E')
}

test.describe('Phase 7 scanner and exit preview flows', () => {
  test.describe.configure({ mode: 'serial' })

  test('manual ticket lookup reaches exit preview without payment side effects', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000)
    await signIn(page)

    const plate = `SCN${testInfo.project.name.slice(0, 2)}${Date.now().toString().slice(-5)}`
    await createEntry(page, plate)

    const ticketHeading = page.getByRole('heading', { name: /^EPG-/ })
    const ticketNumber = (await ticketHeading.textContent())?.trim()
    expect(ticketNumber).toBeTruthy()

    await page.goto('/scanner')
    await expect(page.getByRole('heading', { name: /Scan & exit review/i })).toBeVisible()
    await page.getByLabel('Ticket number').fill(ticketNumber ?? '')
    await page.getByRole('button', { name: 'Look up ticket' }).click()

    await page.waitForURL(/\/exit\//, { timeout: 60_000 })
    await page.getByRole('button', { name: 'Calculate exit preview' }).click()
    await expect(page.getByRole('heading', { name: 'Fee preview' })).toBeVisible({
      timeout: 60_000,
    })
    await expect(page.getByText('No payment required')).toBeVisible()

    const storageKeys = await page.evaluate(() => Object.keys(localStorage))
    expect(storageKeys.some((key) => key.toLowerCase().includes('token'))).toBe(false)
    expect(page.url()).not.toContain('#v1.')
  })

  test('verify route strips fragment after load', async ({ page }) => {
    test.setTimeout(60_000)
    await signIn(page)

    await page.goto('/verify#v1.not-a-real-token-shape-for-route-test-only')
    await expect(page.getByText(/invalid or incomplete/i)).toBeVisible({
      timeout: 30_000,
    })
    await page.waitForURL((url) => !url.hash.includes('v1.'), { timeout: 30_000 })
    expect(page.url()).not.toContain('#v1.')
  })
})
