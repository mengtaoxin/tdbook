import { expect, test } from '@playwright/test'

test.describe('app shell navigation', () => {
  test('title goes home and Home is not in the menu', async ({ page }) => {
    await page.goto('/books')
    await expect(page.getByRole('heading', { name: 'Books' })).toBeVisible()

    await expect(page.getByTestId('desktop-nav').getByRole('link', { name: 'Home' })).toHaveCount(0)
    await expect(page.getByTestId('nav-drawer').getByRole('link', { name: 'Home' })).toHaveCount(0)

    await page.getByTestId('brand-title').click()
    await expect(page).toHaveURL('/')
    await expect(page.getByText(/personal ebook reader/i)).toBeVisible()
  })
})
