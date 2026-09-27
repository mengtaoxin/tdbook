import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAllBookCaches, clearBookCache, ensureBookCached } from '@/lib/bookCache';
import type { CacheProgress } from '@/lib/cacheIngest';
import {
  clearAllCacheRecords,
  getCachedFile,
  isBookCached,
  putFiles,
  resetBlobUrlCacheForTests,
} from '@/lib/cacheStore';

const SOURCE_URL = 'https://example.com/book.epub';

/** fetch stub whose response is held until `release()`; rejects when its signal aborts. */
function gatedFetch() {
  let release: () => void = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    await new Promise<void>((resolve, reject) => {
      void released.then(resolve);
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
    });
    return new Response(new Blob(['book']));
  });
  return { fetchMock, release };
}

function gate() {
  let open: () => void = () => {};
  const opened = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { open, opened };
}

async function writeFileIngest(sourceUrl: string) {
  await putFiles(sourceUrl, [{ relativePath: 'x', blob: new Blob(['x']) }]);
}

function ensure(onProgress?: (progress: CacheProgress) => void, ingest = writeFileIngest) {
  return ensureBookCached(SOURCE_URL, {
    format: { type: 'epub', ingest, snapshot: async () => null },
    catalogId: 'book',
    onProgress,
  });
}

describe('bookCache lifecycle', () => {
  beforeEach(async () => {
    resetBlobUrlCacheForTests();
    await clearAllCacheRecords();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not re-cache a book cleared while its download is in flight', async () => {
    const { fetchMock, release } = gatedFetch();
    vi.stubGlobal('fetch', fetchMock);

    const pending = ensure();
    const settled = pending.catch((err: unknown) => err);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const cleared = clearBookCache(SOURCE_URL);
    release();
    await cleared;

    expect(await settled).toEqual(new Error('errors.cacheCleared'));
    expect(await isBookCached(SOURCE_URL)).toBe(false);
    expect(await getCachedFile(SOURCE_URL, 'x')).toBeNull();
  });

  it('drops files written by an ingest that finishes after the clear', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Blob(['book']))),
    );
    const ingestStarted = gate();
    const ingestRelease = gate();

    const pending = ensure(undefined, async (sourceUrl) => {
      ingestStarted.open();
      await ingestRelease.opened;
      await writeFileIngest(sourceUrl);
    });
    const settled = pending.catch((err: unknown) => err);
    await ingestStarted.opened;

    const cleared = clearBookCache(SOURCE_URL);
    ingestRelease.open();
    await cleared;

    expect(await settled).toEqual(new Error('errors.cacheCleared'));
    expect(await isBookCached(SOURCE_URL)).toBe(false);
    expect(await getCachedFile(SOURCE_URL, 'x')).toBeNull();
  });

  it('does not re-cache in-flight downloads after clearing all caches', async () => {
    const { fetchMock, release } = gatedFetch();
    vi.stubGlobal('fetch', fetchMock);

    const settled = ensure().catch((err: unknown) => err);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const cleared = clearAllBookCaches();
    release();
    await cleared;

    expect(await settled).toEqual(new Error('errors.cacheCleared'));
    expect(await isBookCached(SOURCE_URL)).toBe(false);
  });

  it('downloads again when opened after a clear', async () => {
    const first = gatedFetch();
    vi.stubGlobal('fetch', first.fetchMock);
    const settled = ensure().catch((err: unknown) => err);
    await vi.waitFor(() => expect(first.fetchMock).toHaveBeenCalledTimes(1));
    await Promise.all([clearBookCache(SOURCE_URL), first.release()]);
    await settled;

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Blob(['book']))),
    );
    await ensure();

    expect(await isBookCached(SOURCE_URL)).toBe(true);
    expect(await getCachedFile(SOURCE_URL, 'x')).not.toBeNull();
  });

  it('reports progress to every concurrent caller of the same book', async () => {
    const { fetchMock, release } = gatedFetch();
    vi.stubGlobal('fetch', fetchMock);
    const first: CacheProgress[] = [];
    const second: CacheProgress[] = [];

    const a = ensure((progress) => first.push(progress));
    const b = ensure((progress) => second.push(progress));
    release();
    await Promise.all([a, b]);

    expect(second.map((progress) => progress.phase)).toEqual(first.map((p) => p.phase));
    expect(second.map((progress) => progress.phase)).toContain('download');
    expect(second.at(-1)?.phase).toBe('done');
  });
});
