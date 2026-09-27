import { expect, test } from '@playwright/test';

async function useTestCatalog(page: import('@playwright/test').Page) {
  await page.goto('/settings');
  await page.getByRole('textbox', { name: 'Book config URL' }).fill('/testdata/configs.json');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Book config URL saved')).toBeVisible();
}

test.describe('books reader', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      return indexedDB.deleteDatabase('tdbook-cache');
    });
    await useTestCatalog(page);
  });

  test('lists fixture books and opens an EPUB', async ({ page }) => {
    await page.goto('/books');
    await expect(page.getByRole('heading', { name: 'Books' })).toBeVisible();
    await expect(page.getByText('Sample EPUB')).toBeVisible();
    await expect(page.getByText('Sample PDF')).toBeVisible();

    const epubCard = page.getByRole('button', { name: /Sample EPUB/ });
    await expect(epubCard.getByText('Not downloaded')).toBeVisible();

    await page.getByText('Sample EPUB').click();
    await expect(page).toHaveURL(/\/book\/sample-epub/);
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Page 1 / 2')).toBeVisible();

    await page.getByLabel('Next page').click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText('Page 2 / 2')).toBeVisible();

    await page.goto('/books');
    await expect(
      page.getByRole('button', { name: /Sample EPUB/ }).getByText('Cached'),
    ).toBeVisible();
  });

  test('turns EPUB page with a touch swipe', async ({ page }) => {
    await page.goto('/books');
    await page.getByText('Sample EPUB').click();
    await expect(page.getByTestId('reader-swipe-host')).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText('Page 1 / 2')).toBeVisible();

    const host = page.getByTestId('reader-swipe-host');
    const box = await host.boundingBox();
    if (!box) throw new Error('reader-swipe-host has no bounding box');
    const startX = box.x + box.width * 0.8;
    const endX = box.x + box.width * 0.2;
    const y = box.y + box.height * 0.4;

    await page.evaluate(
      ({ startX, endX, y }) => {
        const target = document.querySelector('[data-testid="reader-swipe-host"]');
        if (!target) throw new Error('reader-swipe-host missing');
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
          );
        };
        fire('pointerdown', startX, y);
        fire('pointerup', endX, y);
      },
      { startX, endX, y },
    );

    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText('Page 2 / 2')).toBeVisible();
  });

  test('opens a PDF fixture', async ({ page }) => {
    await page.goto('/books');
    await page.getByText('Sample PDF').click();
    await expect(page).toHaveURL(/\/book\/sample-pdf/);
    await expect(page.getByTestId('pdf-host')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Page 1 / 1')).toBeVisible();
  });

  test('clears cache from settings', async ({ page }) => {
    await page.goto('/books');
    await page.getByText('Sample EPUB').click();
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 });

    await page.goto('/settings');
    await page.getByRole('button', { name: 'Clear all cache' }).click();
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page.getByText('All book caches cleared')).toBeVisible();
  });

  test('saves and restores the default bookmark while reading', async ({ page }) => {
    await page.goto('/books');
    await expect(page.getByTestId('nav-bookmarks')).toHaveCount(0);

    await page.getByText('Sample EPUB').click();
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('nav-bookmarks')).toBeVisible();
    await expect(page.getByTestId('nav-bookmarks')).toHaveText('Bookmarks');

    await page.getByTestId('nav-bookmarks').click();
    await expect(page.getByTestId('bookmark-jump-default')).toBeDisabled();
    await expect(page.getByTestId('bookmark-jump-default')).toHaveText('Jump to default');
    await expect(page.getByTestId('bookmark-save-default')).toHaveText('Save as default');
    await page.keyboard.press('Escape');

    await page.getByLabel('Next page').click();
    await expect(page).toHaveURL(/page=2/);
    await page.getByTestId('nav-bookmarks').click();
    await page.getByTestId('bookmark-save-default').click();
    await expect(page.getByText('Default bookmark saved.')).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem('books.bookmarks'));
    const parsed = JSON.parse(stored ?? '') as {
      bookmarks: Array<{
        'book-id': string;
        isDefault: boolean;
        location: string;
        name: string;
        page: number;
      }>;
    };
    expect(parsed.bookmarks).toHaveLength(1);
    expect(parsed.bookmarks[0]).toMatchObject({
      'book-id': 'sample-epub',
      isDefault: true,
      name: 'Default bookmark',
      page: 2,
    });
    expect(parsed.bookmarks[0]?.location).toMatch(/^#char:\d+$/);

    await page.getByLabel('Previous page').click();
    await expect(page).toHaveURL(/\/book\/sample-epub\?page=1$/);
    await page.getByTestId('nav-bookmarks').click();
    await page.getByTestId('bookmark-jump-default').click();
    await expect(page).toHaveURL(/\/book\/sample-epub\?page=2/);
    await expect(page.getByText('Page 2 / 2')).toBeVisible();
  });

  test('bookmark restores in-page position after the window is resized', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 });
    await page.goto('/books');
    await page.getByText('Sample EPUB').click();
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 });

    // Scroll the marker near the top of the viewport, then save.
    await page.evaluate(() => {
      const host = document.querySelector('[data-testid="epub-content"]');
      const marker = host?.shadowRoot?.getElementById('bookmark-target');
      marker?.scrollIntoView({ block: 'start' });
    });

    await page.getByTestId('nav-bookmarks').click();
    await page.getByTestId('bookmark-save-default').click();
    await expect(page.getByText('Default bookmark saved.')).toBeVisible();

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('books.bookmarks');
      return raw
        ? (JSON.parse(raw) as { bookmarks: Array<{ location: string; page: number }> })
        : null;
    });
    expect(saved?.bookmarks[0]?.page).toBe(1);
    expect(saved?.bookmarks[0]?.location).toMatch(/^#char:\d+$/);
    const charOffset = Number(/^#char:(\d+)$/.exec(saved?.bookmarks[0]?.location ?? '')?.[1]);
    expect(charOffset).toBeGreaterThan(100);

    await page.getByLabel('Next page').click();
    await expect(page).toHaveURL(/page=2/);

    // Narrow/short viewport would break a scroll-ratio bookmark; content anchors stay put.
    // Compact nav hides the desktop Bookmarks button — jump from the drawer instead.
    await page.setViewportSize({ width: 500, height: 480 });
    await page.getByLabel('Open menu').click();
    const drawer = page.getByTestId('nav-drawer');
    await drawer.getByTestId('drawer-bookmark-jump-default').click();
    await expect(page).toHaveURL(/page=1/);

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const host = document.querySelector('[data-testid="epub-content"]');
          const marker = host?.shadowRoot?.getElementById('bookmark-target');
          if (!marker) return null;
          const top = marker.getBoundingClientRect().top;
          const barBottom =
            document.querySelector('.MuiAppBar-root')?.getBoundingClientRect().bottom ?? 0;
          return top >= barBottom - 40 && top <= barBottom + 160;
        }),
      )
      .toBe(true);
  });

  test('lists and opens a cached EPUB while offline', async ({ page, context }) => {
    await page.goto('/books');
    await page.getByText('Sample EPUB').click();
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Page 1 / 2')).toBeVisible();

    // Client-side nav keeps the SPA shell loaded (dev has no service worker).
    await page.getByTestId('desktop-nav').getByRole('link', { name: 'Books' }).click();
    await expect(
      page.getByRole('button', { name: /Sample EPUB/ }).getByText('Cached'),
    ).toBeVisible();

    await context.setOffline(true);

    await page.getByTestId('brand-title').click();
    await expect(page).toHaveURL('/');
    await page.getByTestId('desktop-nav').getByRole('link', { name: 'Books' }).click();
    await expect(page.getByText('Sample EPUB')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Sample EPUB/ }).getByText('Cached'),
    ).toBeVisible();

    await page.getByText('Sample EPUB').click();
    await expect(page).toHaveURL(/\/book\/sample-epub/);
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Page 1 / 2')).toBeVisible();
  });
});
