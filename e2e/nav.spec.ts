import { expect, test } from '@playwright/test';

test.describe('app shell navigation', () => {
  test('title goes home and Home is not in the menu', async ({ page }) => {
    await page.goto('/books');
    await expect(page.getByRole('heading', { name: 'Books' })).toBeVisible();

    await expect(page.getByTestId('desktop-nav').getByRole('link', { name: 'Home' })).toHaveCount(
      0,
    );
    await expect(page.getByTestId('nav-drawer').getByRole('link', { name: 'Home' })).toHaveCount(0);

    const brand = page.getByTestId('brand-title');
    const beta = brand.getByTestId('brand-beta');
    await expect(beta).toBeVisible();
    await expect(beta).toHaveText(/beta/i);

    await brand.click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/personal ebook reader/i)).toBeVisible();
  });

  test('collapses header actions into a hamburger when the toolbar is too narrow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(
      page.getByTestId('desktop-nav').getByRole('link', { name: 'Books' }),
    ).toBeVisible();
    await expect(page.getByTestId('nav-menu-toggle')).toHaveCount(0);

    // Mid widths used to clip "More" instead of collapsing (padding/gap ignored).
    await page.setViewportSize({ width: 320, height: 800 });
    await expect(page.getByTestId('nav-menu-toggle')).toBeVisible();
    await expect(page.getByTestId('desktop-nav')).toBeHidden();

    await page.getByTestId('nav-menu-toggle').click();
    const drawer = page.getByTestId('nav-drawer');
    await expect(drawer.getByRole('link', { name: 'Books' })).toBeVisible();
    await expect(drawer.getByText('Language')).toHaveCount(0);
    await drawer.getByTestId('nav-drawer-more-toggle').click();
    await expect(drawer.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('Logs, Settings, About, Config Guide, and Feedback live under More', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const desktopNav = page.getByTestId('desktop-nav');
    await expect(desktopNav.getByRole('link', { name: 'Books' })).toBeVisible();
    await expect(desktopNav.getByRole('link', { name: 'Logs' })).toHaveCount(0);
    await expect(desktopNav.getByRole('link', { name: 'Settings' })).toHaveCount(0);
    await expect(desktopNav.getByRole('link', { name: 'About' })).toHaveCount(0);
    await expect(desktopNav.getByRole('link', { name: 'Config Guide' })).toHaveCount(0);
    await expect(desktopNav.getByTestId('nav-feedback')).toHaveCount(0);

    await expect(desktopNav.getByRole('button', { name: 'Language' })).toHaveCount(0);

    const moreToggle = page.getByTestId('nav-more-toggle');
    await expect(moreToggle).toBeVisible();
    await moreToggle.click();

    const moreMenu = page.getByTestId('nav-more-menu');
    await expect(moreMenu.getByRole('menuitem', { name: 'Logs' })).toBeVisible();
    await expect(moreMenu.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
    await expect(moreMenu.getByRole('menuitem', { name: 'About' })).toBeVisible();
    await expect(moreMenu.getByRole('menuitem', { name: 'Config Guide' })).toBeVisible();
    await expect(moreMenu.getByTestId('nav-feedback')).toBeVisible();
    await expect(moreMenu.getByRole('menuitem', { name: 'Help' })).toHaveCount(0);

    await moreMenu.getByRole('menuitem', { name: 'Logs' }).click();
    await expect(page).toHaveURL('/logs');
  });

  test('More menu does not lock page scroll (scrollbar stays)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    async function bodyOverflow() {
      return page.evaluate(() => document.body.style.overflow);
    }

    expect(await bodyOverflow()).not.toBe('hidden');

    await page.getByTestId('nav-more-toggle').click();
    await expect(page.getByTestId('nav-more-menu')).toBeVisible();
    expect(await bodyOverflow()).not.toBe('hidden');
  });

  test('More > Feedback confirms before opening GitHub issues', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await page.getByTestId('nav-more-toggle').click();
    await page.getByTestId('nav-more-menu').getByTestId('nav-feedback').click();

    const confirm = page.getByTestId('nav-feedback-confirm');
    await expect(confirm).toBeVisible();
    await expect(confirm.getByText(/Open GitHub Issues/i)).toBeVisible();

    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirm).toBeHidden();

    await page.getByTestId('nav-more-toggle').click();
    await page.getByTestId('nav-more-menu').getByTestId('nav-feedback').click();
    await expect(confirm).toBeVisible();

    const popupPromise = context.waitForEvent('page');
    await page.getByTestId('nav-feedback-confirm-ok').click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/github\.com\/mengtaoxin\/tdbook\/issues/);
    await popup.close();
  });
});
