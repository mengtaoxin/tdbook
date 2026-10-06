import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateBookConfigsCache } from '@/lib/catalog';
import { clearAllCacheRecords, putMeta, resetBlobUrlCacheForTests } from '@/lib/cacheStore';
import { getConfigsUrl } from '@/lib/settings';
import { useBooksStore } from '@/stores/booksStore';

const catalog = {
  books: [
    {
      id: 'sample-epub',
      title: 'Sample EPUB',
      type: 'epub',
      path: 'https://example.com/sample.epub',
    },
  ],
};

describe('booksStore load refresh', () => {
  beforeEach(async () => {
    localStorage.clear();
    resetBlobUrlCacheForTests();
    await clearAllCacheRecords();
    invalidateBookConfigsCache();
    useBooksStore.getState().invalidate();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/configs.json') || url === '/configs.json') {
          return new Response(JSON.stringify(catalog), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('missing', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    invalidateBookConfigsCache();
    useBooksStore.getState().invalidate();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reloads cached status on a later load after a book is downloaded', async () => {
    await useBooksStore.getState().load();
    expect(useBooksStore.getState().books[0]?.cached).toBe(false);

    await putMeta({
      sourceUrl: 'https://example.com/sample.epub',
      type: 'epub',
      id: 'sample-epub',
      status: 'ready',
      downloadedAt: Date.now(),
      pageCount: 1,
      coverPath: null,
    });

    await useBooksStore.getState().load();
    expect(useBooksStore.getState().books[0]?.cached).toBe(true);
  });

  it('shows the persisted list, then refreshes it when the remote catalog changed', async () => {
    localStorage.setItem(
      'books.configsCache',
      JSON.stringify({ url: getConfigsUrl(), books: catalog.books }),
    );
    const updated = {
      books: [
        ...catalog.books,
        { id: 'new-pdf', title: 'New PDF', type: 'pdf', path: 'https://example.com/new.pdf' },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(updated), { status: 200 })),
    );

    await useBooksStore.getState().load();
    expect(useBooksStore.getState().books.map((b) => b.id)).toEqual(['sample-epub', 'new-pdf']);
    expect(useBooksStore.getState().loaded).toBe(true);
  });

  it('keeps the persisted list when the remote catalog is unreachable', async () => {
    localStorage.setItem(
      'books.configsCache',
      JSON.stringify({ url: getConfigsUrl(), books: catalog.books }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('unreachable');
      }),
    );

    await useBooksStore.getState().load();
    expect(useBooksStore.getState().books.map((b) => b.id)).toEqual(['sample-epub']);
    expect(useBooksStore.getState().error).toBe(false);
  });
});
