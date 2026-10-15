import { expect, test } from '@playwright/test';

test.describe('settings page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('switches the UI language and remembers it', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Language' })).toBeVisible();

    const select = page.getByRole('combobox', { name: 'Display language' });
    await expect(select).toHaveText('English');

    await select.click();
    await page.getByRole('option', { name: '中文' }).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('设置');
    await expect(page.getByRole('combobox', { name: '显示语言' })).toHaveText('中文');

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('设置');
  });
});
