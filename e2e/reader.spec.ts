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

    const epubCard = page.getByRole('button', { name: /Sample EPUB/ })
    await expect(epubCard.getByText('Not downloaded')).toBeVisible()

    await page.getByText('Sample EPUB').click()
    await expect(page).toHaveURL(/\/book\/sample-epub/)
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('Page 1 / 2')).toBeVisible()

    await page.getByLabel('Next page').click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText('Page 2 / 2')).toBeVisible()

    await page.goto('/books')
    await expect(
      page.getByRole('button', { name: /Sample EPUB/ }).getByText('Cached'),
    ).toBeVisible()
  })

  test('turns EPUB page with a touch swipe', async ({ page }) => {
    await page.goto('/books')
    await page.getByText('Sample EPUB').click()
    await expect(page.getByTestId('reader-swipe-host')).toBeVisible({
      timeout: 60_000,
    })
    await expect(page.getByText('Page 1 / 2')).toBeVisible()

    const host = page.getByTestId('reader-swipe-host')
    const box = await host.boundingBox()
    if (!box) throw new Error('reader-swipe-host has no bounding box')
    const startX = box.x + box.width * 0.8
    const endX = box.x + box.width * 0.2
    const y = box.y + box.height * 0.4

    await page.evaluate(
      ({ startX, endX, y }) => {
        const target = document.querySelector('[data-testid="reader-swipe-host"]')
        if (!target) throw new Error('reader-swipe-host missing')
        const fire = (type, x, yPos) => {
          target.dispatchEvent(
            new PointerEvent(type, {
              bubbles: true,
              cancelable: true,
              composed: true,
              pointerType: 'touch',
              pointerId: 1,
              isPrimary: true,
              clientX: x,
              clientY: yPos,
            }),
          )
        }
        fire('pointerdown', startX, y)
        fire('pointerup', endX, y)
      },
      { startX, endX, y },
    )

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

  test('saves and restores the default bookmark while reading', async ({ page }) => {
    await page.goto('/books')
    await expect(page.getByTestId('nav-bookmarks')).toHaveCount(0)

    await page.getByText('Sample EPUB').click()
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByTestId('nav-bookmarks')).toBeVisible()

    await page.getByTestId('nav-bookmarks').click()
    await expect(page.getByTestId('bookmark-jump-default')).toBeDisabled()
    await page.keyboard.press('Escape')

    await page.getByLabel('Next page').click()
    await expect(page).toHaveURL(/page=2/)
    await page.getByTestId('nav-bookmarks').click()
    await page.getByTestId('bookmark-save-default').click()
    await expect(page.getByText('Default bookmark saved.')).toBeVisible()

    const stored = await page.evaluate(() => localStorage.getItem('books.bookmarks'))
    expect(JSON.parse(stored ?? '')).toEqual({
      bookmarks: [
        {
          'book-id': 'sample-epub',
          isDefault: true,
          location: '',
          name: 'Default bookmark',
          page: 2,
        },
      ],
    })

    await page.getByLabel('Previous page').click()
    await expect(page).toHaveURL(/\/book\/sample-epub\?page=1$/)
    await page.getByTestId('nav-bookmarks').click()
    await page.getByTestId('bookmark-jump-default').click()
    await expect(page).toHaveURL(/\/book\/sample-epub\?page=2/)
    await expect(page.getByText('Page 2 / 2')).toBeVisible()
  })
})
