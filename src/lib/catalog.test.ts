import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPersistedBookConfigs,
  getBookConfigs,
  getPersistedBookConfigs,
  invalidateBookConfigsCache,
  revalidateBookConfigs,
} from '@/lib/catalog';
import { setConfigsUrl } from '@/lib/settings';

const remoteCatalog = {
  books: [
    {
      id: 'remote-book',
      title: 'Remote Book',
      type: 'epub',
      path: 'https://example.com/remote.epub',
    },
  ],
};

describe('getBookConfigs localStorage cache', () => {
  beforeEach(() => {
    localStorage.clear();
    invalidateBookConfigsCache();
    setConfigsUrl('https://cdn.example.com/configs.json');
  });

  afterEach(() => {
    invalidateBookConfigsCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('persists a successful fetch and reuses it when the network fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(remoteCatalog), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );

    const first = await getBookConfigs();
    expect(first.books.map((b) => b.id)).toEqual(['remote-book']);
    expect(getPersistedBookConfigs()?.url).toBe('https://cdn.example.com/configs.json');

    invalidateBookConfigsCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );

    const second = await getBookConfigs();
    expect(second.books.map((b) => b.id)).toEqual(['remote-book']);
  });

  it('does not return a persisted catalog for a different URL', async () => {
    localStorage.setItem(
      'books.configsCache',
      JSON.stringify({
        url: 'https://other.example/configs.json',
        books: remoteCatalog.books,
      }),
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );

    const result = await getBookConfigs();
    expect(result.books).toEqual([]);
  });

  it('clearPersistedBookConfigs removes the durable cache', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(remoteCatalog), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );

    await getBookConfigs();
    expect(getPersistedBookConfigs()).not.toBeNull();

    clearPersistedBookConfigs();
    invalidateBookConfigsCache();
    expect(getPersistedBookConfigs()).toBeNull();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    const result = await getBookConfigs();
    expect(result.books).toEqual([]);
  });

  it('serves the persisted catalog without fetching when navigator.onLine is false', async () => {
    localStorage.setItem(
      'books.configsCache',
      JSON.stringify({
        url: 'https://cdn.example.com/configs.json',
        books: remoteCatalog.books,
      }),
    );

    const fetchMock = vi.fn(async () => {
      throw new Error('should not fetch while offline');
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { onLine: false });

    const result = await getBookConfigs();
    expect(result.books.map((b) => b.id)).toEqual(['remote-book']);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

const CONFIGS_URL = 'https://cdn.example.com/configs.json';

const updatedCatalog = {
  books: [
    ...remoteCatalog.books,
    {
      id: 'new-book',
      title: 'New Book',
      type: 'pdf',
      path: 'https://example.com/new.pdf',
    },
  ],
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function persistCatalog(books: unknown[]) {
  localStorage.setItem('books.configsCache', JSON.stringify({ url: CONFIGS_URL, books }));
}

describe('getBookConfigs / revalidateBookConfigs remote updates', () => {
  beforeEach(() => {
    localStorage.clear();
    invalidateBookConfigsCache();
    setConfigsUrl(CONFIGS_URL);
  });

  afterEach(() => {
    invalidateBookConfigsCache();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('serves the persisted catalog without waiting for the network', async () => {
    persistCatalog(remoteCatalog.books);
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getBookConfigs();
    expect(result.books.map((b) => b.id)).toEqual(['remote-book']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('revalidates past the HTTP cache and picks up a remote update', async () => {
    persistCatalog(remoteCatalog.books);
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse(updatedCatalog),
    );
    vi.stubGlobal('fetch', fetchMock);

    await getBookConfigs();
    expect(await revalidateBookConfigs()).toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(CONFIGS_URL);
    expect(fetchMock.mock.calls[0]?.[1]?.cache).toBe('no-cache');

    const result = await getBookConfigs();
    expect(result.books.map((b) => b.id)).toEqual(['remote-book', 'new-book']);
    expect(getPersistedBookConfigs()?.books.map((b) => b.id)).toEqual(['remote-book', 'new-book']);
  });

  it('reports no change when the remote catalog is identical', async () => {
    persistCatalog(remoteCatalog.books);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(remoteCatalog)),
    );

    await getBookConfigs();
    expect(await revalidateBookConfigs()).toBe(false);
  });

  it('keeps the current catalog when revalidation fails', async () => {
    persistCatalog(remoteCatalog.books);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('unreachable');
      }),
    );

    await getBookConfigs();
    expect(await revalidateBookConfigs()).toBe(false);
    expect((await getBookConfigs()).books.map((b) => b.id)).toEqual(['remote-book']);
    expect(getPersistedBookConfigs()?.books.map((b) => b.id)).toEqual(['remote-book']);
  });

  it('does not revalidate while navigator.onLine is false', async () => {
    persistCatalog(remoteCatalog.books);
    const fetchMock = vi.fn(async () => jsonResponse(updatedCatalog));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { onLine: false });

    expect(await revalidateBookConfigs()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores a response without a books array instead of wiping the cache', async () => {
    persistCatalog(remoteCatalog.books);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ unexpected: true })),
    );

    expect(await revalidateBookConfigs()).toBe(false);
    expect((await getBookConfigs()).books.map((b) => b.id)).toEqual(['remote-book']);
    expect(getPersistedBookConfigs()?.books.map((b) => b.id)).toEqual(['remote-book']);
  });

  it('retries the network after a failed first load instead of pinning an empty list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('unreachable');
      }),
    );
    expect((await getBookConfigs()).books).toEqual([]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(remoteCatalog)),
    );
    expect((await getBookConfigs()).books.map((b) => b.id)).toEqual(['remote-book']);
  });

  it('skips revalidation shortly after a successful download, then checks again later', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const fetchMock = vi.fn(async () => jsonResponse(remoteCatalog));
    vi.stubGlobal('fetch', fetchMock);

    await getBookConfigs();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(await revalidateBookConfigs()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 60_000);
    await revalidateBookConfigs();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not let an in-flight download for an old URL overwrite the new one', async () => {
    let resolveOld: (response: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveOld = resolve;
          }),
      ),
    );
    const pending = getBookConfigs();

    setConfigsUrl('https://other.example/configs.json');
    invalidateBookConfigsCache();
    resolveOld(jsonResponse(remoteCatalog));
    await pending;

    expect(getPersistedBookConfigs()).toBeNull();
  });
});
