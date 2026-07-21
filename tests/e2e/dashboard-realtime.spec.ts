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
  for (const vehicleType of ['Car', 'Motorcycle'] as const) {
    await page.goto('/entry')
    await expect(page.getByRole('heading', { name: 'Vehicle entry' })).toBeVisible()
    await page.getByLabel('Plate number').fill(plate)
    await page.getByLabel('Vehicle type').selectOption({ label: vehicleType })
    const spaceSelect = page.getByLabel('Parking space')
    const firstSpace = spaceSelect.locator('option:not([value=""])').first()
    const hasSpace = await firstSpace
      .getAttribute('value', { timeout: 5_000 })
      .catch(() => null)

    if (!hasSpace) {
      continue
    }

    await spaceSelect.selectOption(hasSpace)
    await page.getByRole('button', { name: 'Create entry and issue ticket' }).click()

    try {
      await page.waitForURL(/\/tickets\/.*issued=1/, { timeout: 60_000 })
      return
    } catch {
      const unavailable = page.getByText(/selected space is not available/i)
      if (await unavailable.isVisible().catch(() => false)) {
        continue
      }

      throw new Error('Entry creation failed without a recoverable space conflict')
    }
  }

  throw new Error('No available parking spaces for dashboard realtime E2E')
}

test.describe('dashboard realtime', () => {
  test.describe.configure({ mode: 'serial' })
  test('loads operational snapshot and shows live status controls', async ({
    page,
  }) => {
    await signIn(page)

    await expect(
      page.getByRole('main').getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible()
    await expect(page.getByRole('region', { name: 'Operational metrics' })).toBeVisible()
    await expect(page.getByText(/Status:/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible()
  })

  test('second client converges after entry', async ({ browser }) => {
    test.setTimeout(120_000)
    const plate = `RT${Date.now().toString().slice(-6)}`
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    await signIn(pageA)
    await signIn(pageB)

    const entriesBeforeText = await pageB
      .getByText('Entries today')
      .locator('..')
      .locator('p.font-mono')
      .first()
      .textContent()

    await createEntry(pageA, plate)

    const readEntriesMetric = async () =>
      pageB
        .getByText('Entries today')
        .locator('..')
        .locator('p.font-mono')
        .first()
        .textContent()

    try {
      await expect.poll(readEntriesMetric, { timeout: 5_000 }).not.toBe(
        entriesBeforeText,
      )
    } catch {
      await pageB.getByRole('button', { name: /Refresh/i }).click()
      await expect.poll(readEntriesMetric, { timeout: 10_000 }).not.toBe(
        entriesBeforeText,
      )
    }

    await contextA.close()
    await contextB.close()
  })
})
