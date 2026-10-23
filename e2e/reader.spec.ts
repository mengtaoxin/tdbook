import { expect, test } from '@playwright/test';

test.describe('books reader', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      return indexedDB.deleteDatabase('tdbook-cache');
    });
  });

  test('lists sample books and opens an EPUB', async ({ page }) => {
    await page.goto('/books');
    await expect(page.getByRole('heading', { name: 'Books' })).toBeVisible();
    await expect(page.getByText("Alice's Adventures in Wonderland")).toBeVisible();
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
      ({ startX: fromX, endX: toX, y: atY }) => {
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
        fire('pointerdown', fromX, atY);
        fire('pointerup', toX, atY);
      },
      { startX, endX, y },
    );

    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText('Page 2 / 2')).toBeVisible();
  });

  test('opens a sample PDF', async ({ page }) => {
    await page.goto('/books');
    await page.getByText('Sample PDF').click();
    await expect(page).toHaveURL(/\/book\/sample-pdf/);
    await expect(page.getByTestId('pdf-host')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Sample PDF' })).toBeVisible();
    await expect(page.getByText('Test Author · PDF')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Page 1 / 1' })).toBeVisible();
    await expect(page.locator('[data-testid="pdf-host"] canvas')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  test('exposes the book, the current passage, and the selection', async ({ page }) => {
    await page.goto('/books');
    await page.getByText('Sample EPUB').click();
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Sample EPUB' })).toBeVisible();
    await expect(page.getByText('Test Author · EPUB')).toBeVisible();
    await expect(page).toHaveTitle('Sample EPUB — tdbook');
    await expect(page.getByRole('status').filter({ hasText: 'Page 1 / 2' })).toBeVisible();
    await expect(page.getByTestId('reader-passage')).toContainText('Chapter One');

    await expect
      .poll(() =>
        page.evaluate(() => {
          const host = document.querySelector('[data-testid="epub-content"]');
          return host?.querySelector('[aria-current="location"]')?.textContent ?? '';
        }),
      )
      .toContain('Chapter One');

    await page.evaluate(() => {
      const host = document.querySelector('[data-testid="epub-content"]');
      const target = host?.querySelectorAll('p')[8];
      const bar = document.querySelector('.MuiAppBar-root');
      if (!target || !bar) throw new Error('missing passage target');
      const line = bar.getBoundingClientRect().bottom;
      window.scrollBy(0, target.getBoundingClientRect().top - line);
    });

    await expect
      .poll(() =>
        page.evaluate(() => {
          const host = document.querySelector('[data-testid="epub-content"]');
          return host?.querySelector('[aria-current="location"]')?.textContent ?? '';
        }),
      )
      .toContain('Paragraph 08');

    await page.evaluate(() => {
      const host = document.querySelector('[data-testid="epub-content"]');
      const paragraph = host?.querySelector('p');
      if (!paragraph?.firstChild) throw new Error('missing paragraph');
      const range = document.createRange();
      range.selectNodeContents(paragraph);
      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });
    await expect(page.getByTestId('reader-selection')).toContainText(
      'Hello from sample EPUB page one.',
    );
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

  test('saves, lists, renames, and jumps to bookmarks while reading', async ({ page }) => {
    await page.goto('/books');
    await expect(page.getByTestId('nav-bookmarks')).toHaveCount(0);

    await page.getByText('Sample EPUB').click();
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('nav-bookmarks')).toHaveText('Bookmarks');

    const menu = page.getByTestId('nav-bookmarks-menu');
    const items = menu.locator('[data-testid^="bookmark-item-"]');
    await page.getByTestId('nav-bookmarks').click();
    await expect(menu.getByTestId('bookmark-save')).toHaveText('Save bookmark');
    await expect(menu.getByTestId('bookmark-empty')).toHaveText('No bookmarks yet');
    await page.keyboard.press('Escape');

    await page.getByLabel('Next page').click();
    await expect(page).toHaveURL(/page=2/);
    await page.getByTestId('nav-bookmarks').click();
    await menu.getByTestId('bookmark-save').click();
    await expect(page.getByText('Bookmark saved.')).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem('books.bookmarks'));
    const parsed = JSON.parse(stored ?? '') as {
      bookmarks: Array<{ bookId: string; location: string; name?: string; page: number }>;
    };
    expect(parsed.bookmarks).toHaveLength(1);
    expect(parsed.bookmarks[0]).toMatchObject({ bookId: 'sample-epub', page: 2 });
    expect(parsed.bookmarks[0]?.name).toBeUndefined();
    expect(parsed.bookmarks[0]?.location).toMatch(/^#char:\d+$/);

    await page.getByLabel('Previous page').click();
    await expect(page).toHaveURL(/\/book\/sample-epub\?page=1$/);
    await page.getByTestId('nav-bookmarks').click();
    await expect(menu.getByText('Recent')).toBeVisible();
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Page 2');
    await items.first().click();
    await expect(page).toHaveURL(/\/book\/sample-epub\?page=2/);
    await expect(page.getByText('Page 2 / 2')).toBeVisible();

    await page.getByTestId('nav-bookmarks').click();
    await menu.locator('[data-testid^="bookmark-edit-"]').first().click();
    const dialog = page.getByTestId('bookmark-rename-dialog');
    await expect(dialog.getByTestId('bookmark-rename-confirm')).toBeDisabled();
    await dialog.getByTestId('bookmark-rename-input').fill('Chapter two');
    await dialog.getByTestId('bookmark-rename-confirm').click();
    await expect(page.getByText('Bookmark named.')).toBeVisible();
    await expect(dialog).toHaveCount(0);
    await expect(menu.getByText('Named')).toBeVisible();
    await expect(menu.getByText('Recent')).toHaveCount(0);
    await expect(items.first()).toContainText('Chapter two');

    await menu.locator('[data-testid^="bookmark-edit-"]').first().click();
    await dialog.getByTestId('bookmark-delete').click();
    await expect(page.getByText('Bookmark deleted.')).toBeVisible();
    await expect(menu.getByTestId('bookmark-empty')).toBeVisible();
  });

  test('bookmark restores in-page position after the window is resized', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 });
    await page.goto('/books');
    await page.getByText('Sample EPUB').click();
    await expect(page.getByTestId('epub-content')).toBeVisible({ timeout: 60_000 });

    // Scroll the marker near the top of the viewport, then save.
    await page.evaluate(() => {
      const host = document.querySelector('[data-testid="epub-content"]');
      const marker = host?.querySelector('#bookmark-target');
      marker?.scrollIntoView({ block: 'start' });
    });

    await page.getByTestId('nav-bookmarks').click();
    await page.getByTestId('nav-bookmarks-menu').getByTestId('bookmark-save').click();
    await expect(page.getByText('Bookmark saved.')).toBeVisible();

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('books.bookmarks');
      return raw
        ? (JSON.parse(raw) as {
            bookmarks: Array<{ id: string; location: string; page: number }>;
          })
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
    await page.setViewportSize({ width: 360, height: 480 });
    await page.getByLabel('Open menu').click();
    const drawer = page.getByTestId('nav-drawer');
    await drawer.getByTestId(`bookmark-item-${saved?.bookmarks[0]?.id}`).click();
    await expect(page).toHaveURL(/page=1/);

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const host = document.querySelector('[data-testid="epub-content"]');
          const marker = host?.querySelector('#bookmark-target');
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

  test('EPUB body text is a native browser selection', async ({ page }) => {
    await page.goto('/books');
    await page.getByText('Sample EPUB').click();
    const paragraph = page.getByText('Hello from sample EPUB page one.');
    await expect(paragraph).toBeVisible({ timeout: 60_000 });
    await paragraph.selectText();

    const selected = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    expect(selected).toContain('Hello from sample EPUB page one.');

    const userSelect = await paragraph.evaluate((el) => getComputedStyle(el).userSelect);
    expect(userSelect).not.toBe('none');
  });

  test('PDF body text is a native browser selection', async ({ page }) => {
    await page.goto('/books');
    await page.getByText('Sample PDF').click();
    const span = page.locator('.textLayer span', { hasText: 'Sample PDF' });
    await expect(span).toBeVisible({ timeout: 60_000 });
    await span.selectText();

    const selected = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    expect(selected).toContain('Sample PDF');
    await expect(span).not.toHaveAttribute('role', 'presentation');
    await expect(page.locator('.pdf-page > canvas')).toHaveAttribute('aria-hidden', 'true');

    const userSelect = await span.evaluate((el) => getComputedStyle(el).userSelect);
    expect(userSelect).not.toBe('none');
  });
});
