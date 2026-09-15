import { expect, test } from '@playwright/test'

async function useTestCatalog(page: import('@playwright/test').Page) {
  await page.goto('/settings')
  await page.getByRole('textbox', { name: 'Book config URL' }).fill('/testdata/configs.json')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Book config URL saved')).toBeVisible()
}

test.describe('books reader', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      return indexedDB.deleteDatabase('books-cache')
    })
    await useTestCatalog(page)
  })

  test('lists fixture books and opens an EPUB', async ({ page }) => {
    await page.goto('/books')
    await expect(page.getByRole('heading', { name: 'Books' })).toBeVisible()
    await expect(page.getByText('Sample EPUB')).toBeVisible()
    await expect(page.getByText('Sample PDF')).toBeVisible()

    await page.getByText('Sample EPUB').click()
    await expect(page).toHaveURL(/\/book\/sample-epub/)
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('Page 1 / 2')).toBeVisible()

    await page.getByLabel('Next page').click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText('Page 2 / 2')).toBeVisible()
  })

  test('opens a PDF fixture', async ({ page }) => {
    await page.goto('/books')
    await page.getByText('Sample PDF').click()
    await expect(page).toHaveURL(/\/book\/sample-pdf/)
    await expect(page.getByTestId('pdf-host')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('Page 1 / 1')).toBeVisible()
  })

  test('clears cache from settings', async ({ page }) => {
    await page.goto('/books')
    await page.getByText('Sample EPUB').click()
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 })

    await page.goto('/settings')
    await page.getByRole('button', { name: 'Clear all cache' }).click()
    await page.getByRole('button', { name: 'Clear', exact: true }).click()
    await expect(page.getByText('All book caches cleared')).toBeVisible()
  })
})
