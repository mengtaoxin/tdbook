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

  test('Help > Feedback confirms before opening GitHub issues', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const helpToggle = page.getByTestId('nav-help-toggle')
    await expect(helpToggle).toBeVisible()
    await helpToggle.click()
    await page.getByTestId('nav-help-menu').getByTestId('nav-feedback').click()

    const confirm = page.getByTestId('nav-feedback-confirm')
    await expect(confirm).toBeVisible()
    await expect(confirm.getByText(/Open GitHub Issues/i)).toBeVisible()

    await confirm.getByRole('button', { name: 'Cancel' }).click()
    await expect(confirm).toBeHidden()

    await helpToggle.click()
    await page.getByTestId('nav-help-menu').getByTestId('nav-feedback').click()
    await expect(confirm).toBeVisible()

    const popupPromise = context.waitForEvent('page')
    await page.getByTestId('nav-feedback-confirm-ok').click()
    const popup = await popupPromise
    await expect(popup).toHaveURL(/github\.com\/mengtaoxin\/tdbook\/issues/)
    await popup.close()
  })
})
