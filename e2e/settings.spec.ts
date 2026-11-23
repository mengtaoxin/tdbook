import { expect, test, type Page } from '@playwright/test';

test.describe('settings page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('switches the UI language and remembers it', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Language' })).toBeVisible();
    await expect(page.getByTestId('nav-breadcrumb')).toHaveText(/More\s*\/\s*Settings/);

    const select = page.getByRole('combobox', { name: 'Display language' });
    await expect(select).toHaveText('English');

    await select.click();
    await page.getByRole('option', { name: '中文' }).click();

    await expect(page.getByTestId('nav-breadcrumb')).toHaveText(/更多\s*\/\s*设置/);
    await expect(page.getByRole('combobox', { name: '显示语言' })).toHaveText('中文');

    await page.reload();
    await expect(page.getByTestId('nav-breadcrumb')).toHaveText(/更多\s*\/\s*设置/);
  });

  test('clear-cache confirm does not change the page width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 });
    await page.goto('/settings');

    await expect(page.getByTestId('nav-breadcrumb')).toHaveText(/More\s*\/\s*Settings/);
    const before = await pageWidth(page);

    await page.getByRole('button', { name: 'Clear all cache' }).click();
    const dialog = page.getByRole('dialog', { name: 'Clear all cache?' });
    await expect(dialog).toBeVisible();

    // Scroll lock drops the overlay scrollbar gutter and pads the body, so the
    // page width jumps. Headless Chromium has no overlay scrollbar; overflow
    // staying visible is what keeps the width stable there too.
    expect(await pageWidth(page)).toEqual(before);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    expect(await pageWidth(page)).toEqual(before);
  });
});

async function pageWidth(page: Page) {
  return page.evaluate(() => {
    const language = document.querySelector('h2');
    const box = language?.getBoundingClientRect();
    return {
      headingX: box?.x ?? null,
      headingWidth: box?.width ?? null,
      htmlClientWidth: document.documentElement.clientWidth,
      bodyClientWidth: document.body.clientWidth,
    };
  });
}
