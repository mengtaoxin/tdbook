import { expect, test } from '@playwright/test'

async function useTestCatalog(page: import('@playwright/test').Page) {
  await page.goto('/settings')
  await page.getByRole('textbox', { name: '图书配置文件地址' }).fill('/testdata/configs.json')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('已保存图书配置文件地址')).toBeVisible()
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
    await expect(page.getByRole('heading', { name: '图书列表' })).toBeVisible()
    await expect(page.getByText('Sample EPUB')).toBeVisible()
    await expect(page.getByText('Sample PDF')).toBeVisible()

    await page.getByText('Sample EPUB').click()
    await expect(page).toHaveURL(/\/book\/sample-epub/)
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('第 1 / 2 页')).toBeVisible()

    await page.getByLabel('下一页').click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText('第 2 / 2 页')).toBeVisible()
  })

  test('opens a PDF fixture', async ({ page }) => {
    await page.goto('/books')
    await page.getByText('Sample PDF').click()
    await expect(page).toHaveURL(/\/book\/sample-pdf/)
    await expect(page.getByTestId('pdf-host')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('第 1 / 1 页')).toBeVisible()
  })

  test('clears cache from settings', async ({ page }) => {
    await page.goto('/books')
    await page.getByText('Sample EPUB').click()
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 })

    await page.goto('/settings')
    await page.getByRole('button', { name: '清除全部缓存' }).click()
    await page.getByRole('button', { name: '清除', exact: true }).click()
    await expect(page.getByText('已清除全部图书缓存')).toBeVisible()
  })
})
