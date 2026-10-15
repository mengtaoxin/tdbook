import { expect, test } from '@playwright/test';

test.describe('home page', () => {
  test('leads with an annotated configs.json sample', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/one read-only json file/i);

    const sample = page.getByTestId('home-json-sample');
    await expect(sample).toBeVisible();
    await expect(sample.getByText('configs.json')).toBeVisible();
    await expect(sample.getByText(/^"(books|id|title|author|type|path|hover)"$/)).toHaveCount(7);
    await expect(sample.getByText(/becomes the reader url/i)).toBeVisible();
    await expect(sample.getByText('required').first()).toBeVisible();
    await expect(sample.getByText('optional').first()).toBeVisible();

    await expect(page.getByText(/no server/i).first()).toBeVisible();

    await page.getByRole('link', { name: /write your configs\.json/i }).click();
    await expect(page).toHaveURL('/config-guide');
  });

  test('shows the annotations in Chinese', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('books.locale', 'zh'));
    await page.reload();

    const sample = page.getByTestId('home-json-sample');
    await expect(sample.getByText('必填').first()).toBeVisible();
    await expect(sample.getByText('可选').first()).toBeVisible();
  });
});
