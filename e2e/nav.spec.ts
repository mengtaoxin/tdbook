import { expect, test } from '@playwright/test'

test.describe('app shell navigation', () => {
  test('title goes home and Home is not in the menu', async ({ page }) => {
    await page.goto('/books')
    await expect(page.getByRole('heading', { name: 'Books' })).toBeVisible()

    await expect(page.getByTestId('desktop-nav').getByRole('link', { name: 'Home' })).toHaveCount(0)
    await expect(page.getByTestId('nav-drawer').getByRole('link', { name: 'Home' })).toHaveCount(0)

    const brand = page.getByTestId('brand-title')
    const beta = brand.getByTestId('brand-beta')
    await expect(beta).toBeVisible()
    await expect(beta).toHaveText(/beta/i)

    await brand.click()
    await expect(page).toHaveURL('/')
    await expect(page.getByText(/personal ebook reader/i)).toBeVisible()
  })

  test('Logs, Settings, About, Config Guide, and Feedback live under More after Language', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const desktopNav = page.getByTestId('desktop-nav')
    await expect(desktopNav.getByRole('link', { name: 'Books' })).toBeVisible()
    await expect(desktopNav.getByRole('link', { name: 'Logs' })).toHaveCount(0)
    await expect(desktopNav.getByRole('link', { name: 'Settings' })).toHaveCount(0)
    await expect(desktopNav.getByRole('link', { name: 'About' })).toHaveCount(0)
    await expect(
      desktopNav.getByRole('link', { name: 'Config Guide' }),
    ).toHaveCount(0)
    await expect(desktopNav.getByTestId('nav-feedback')).toHaveCount(0)

    const localeToggle = page.getByTestId('nav-locale-toggle')
    const moreToggle = page.getByTestId('nav-more-toggle')
    await expect(localeToggle).toBeVisible()
    await expect(moreToggle).toBeVisible()
    const localeBox = await localeToggle.boundingBox()
    const moreBox = await moreToggle.boundingBox()
    expect(localeBox).toBeTruthy()
    expect(moreBox).toBeTruthy()
    expect(moreBox!.x).toBeGreaterThan(localeBox!.x)

    await moreToggle.click()

    const moreMenu = page.getByTestId('nav-more-menu')
    await expect(moreMenu.getByRole('menuitem', { name: 'Logs' })).toBeVisible()
    await expect(moreMenu.getByRole('menuitem', { name: 'Settings' })).toBeVisible()
    await expect(moreMenu.getByRole('menuitem', { name: 'About' })).toBeVisible()
    await expect(
      moreMenu.getByRole('menuitem', { name: 'Config Guide' }),
    ).toBeVisible()
    await expect(moreMenu.getByTestId('nav-feedback')).toBeVisible()
    await expect(moreMenu.getByRole('menuitem', { name: 'Help' })).toHaveCount(0)

    await moreMenu.getByRole('menuitem', { name: 'Logs' }).click()
    await expect(page).toHaveURL('/logs')
  })

  test('More > Feedback confirms before opening GitHub issues', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    await page.getByTestId('nav-more-toggle').click()
    await page.getByTestId('nav-more-menu').getByTestId('nav-feedback').click()

    const confirm = page.getByTestId('nav-feedback-confirm')
    await expect(confirm).toBeVisible()
    await expect(confirm.getByText(/Open GitHub Issues/i)).toBeVisible()

    await confirm.getByRole('button', { name: 'Cancel' }).click()
    await expect(confirm).toBeHidden()

    await page.getByTestId('nav-more-toggle').click()
    await page.getByTestId('nav-more-menu').getByTestId('nav-feedback').click()
    await expect(confirm).toBeVisible()

    const popupPromise = context.waitForEvent('page')
    await page.getByTestId('nav-feedback-confirm-ok').click()
    const popup = await popupPromise
    await expect(popup).toHaveURL(/github\.com\/mengtaoxin\/tdbook\/issues/)
    await popup.close()
  })
})
