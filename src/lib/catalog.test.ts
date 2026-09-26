import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPersistedBookConfigs,
  getBookConfigs,
  getPersistedBookConfigs,
  invalidateBookConfigsCache,
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
});
