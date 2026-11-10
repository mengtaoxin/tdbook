import type { BookType } from './bookTypes';
import { canUseOpfsCache, type CacheDb } from './cacheDb';
import { migrateLegacyIndexedDbCache } from './cacheMigrateIdb';
import { openMemoryCacheDb } from './cacheSqliteMemory';
import { openOpfsCacheDb } from './cacheSqliteOpfs';

export type BookCacheMeta = {
  sourceUrl: string;
  type: BookType;
  /** Catalog identity (configs.json `id`). */
  id: string;
  status: 'ready';
  downloadedAt: number;
  /** Set by format snapshot after ingest; omitted on pre-snapshot caches. */
  pageCount?: number;
  /**
   * Cached cover file path. `null` means no cover; omitted means snapshot not written yet.
   */
  coverPath?: string | null;
};

const KEY_SEP = '\0';

const blobUrlCache = new Map<string, string>();
const pendingBlobUrls = new Map<string, Promise<string | null>>();

let dbPromise: Promise<CacheDb> | null = null;

async function openCacheDb(): Promise<CacheDb> {
  if (canUseOpfsCache()) {
    try {
      return await openOpfsCacheDb();
    } catch (error) {
      console.warn('OPFS book cache unavailable; falling back to memory', error);
    }
  }
  return openMemoryCacheDb();
}

async function getDb(): Promise<CacheDb> {
  if (!dbPromise) {
    dbPromise = openCacheDb();
  }
  const db = await dbPromise;
  // Cheap no-op when the Dexie DB is gone; needed so tests can seed IDB after first open.
  await migrateLegacyIndexedDbCache(db);
  return db;
}

/** Test helper: force the next open through a fresh backend (memory in Vitest). */
export async function resetCacheDbForTests(): Promise<void> {
  dbPromise = null;
}

function blobUrlKey(sourceUrl: string, relativePath: string) {
  return `${sourceUrl}${KEY_SEP}${relativePath}`;
}

export async function getBookCacheMeta(sourceUrl: string): Promise<BookCacheMeta | null> {
  const meta = await (await getDb()).getMeta(sourceUrl);
  return meta?.status === 'ready' ? meta : null;
}

export async function isBookCached(sourceUrl: string): Promise<boolean> {
  return Boolean(await getBookCacheMeta(sourceUrl));
}

export async function getCachedFile(sourceUrl: string, relativePath: string): Promise<Blob | null> {
  return (await getDb()).getFile(sourceUrl, relativePath);
}

async function createCachedBlobUrl(
  sourceUrl: string,
  relativePath: string,
  cacheKey: string,
): Promise<string | null> {
  const blob = await getCachedFile(sourceUrl, relativePath);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  blobUrlCache.set(cacheKey, url);
  return url;
}

export function getCachedBlobUrl(sourceUrl: string, relativePath: string): Promise<string | null> {
  const cacheKey = blobUrlKey(sourceUrl, relativePath);
  const existing = blobUrlCache.get(cacheKey);
  if (existing) return Promise.resolve(existing);

  const inFlight = pendingBlobUrls.get(cacheKey);
  if (inFlight) return inFlight;

  const pending = createCachedBlobUrl(sourceUrl, relativePath, cacheKey).finally(() => {
    pendingBlobUrls.delete(cacheKey);
  });
  pendingBlobUrls.set(cacheKey, pending);
  return pending;
}

/** In-memory blob URL for a cached file, if already created. */
export function peekBlobUrl(sourceUrl: string, relativePath: string): string | undefined {
  return blobUrlCache.get(blobUrlKey(sourceUrl, relativePath));
}

export function peekBlobUrlsForRelativePath(relativePath: string): string[] {
  const suffix = `${KEY_SEP}${relativePath}`;
  const urls: string[] = [];
  for (const [key, url] of blobUrlCache) {
    if (key.endsWith(suffix)) urls.push(url);
  }
  return urls;
}

function revokeBlobUrlsForSource(sourceUrl: string) {
  const prefix = `${sourceUrl}${KEY_SEP}`;
  for (const [key, url] of blobUrlCache) {
    if (key.startsWith(prefix)) {
      URL.revokeObjectURL(url);
      blobUrlCache.delete(key);
    }
  }
}

export async function deleteBookCacheRecords(sourceUrl: string): Promise<void> {
  revokeBlobUrlsForSource(sourceUrl);
  await (await getDb()).deleteBook(sourceUrl);
}

export async function clearAllCacheRecords(): Promise<void> {
  for (const [, url] of blobUrlCache) {
    URL.revokeObjectURL(url);
  }
  blobUrlCache.clear();

  await (await getDb()).clearAll();
}

export async function putFiles(
  sourceUrl: string,
  entries: Array<{ relativePath: string; blob: Blob }>,
): Promise<void> {
  await (await getDb()).putFiles(sourceUrl, entries);
}

export async function putMeta(meta: BookCacheMeta): Promise<void> {
  await (await getDb()).putMeta(meta);
}

export async function readCachedText(
  sourceUrl: string,
  relativePath: string,
): Promise<string | null> {
  const blob = await getCachedFile(sourceUrl, relativePath);
  if (!blob) return null;
  return blob.text();
}

/** Test helper: drop in-memory blob URLs without touching the SQLite cache. */
export function resetBlobUrlCacheForTests() {
  for (const [, url] of blobUrlCache) {
    URL.revokeObjectURL(url);
  }
  blobUrlCache.clear();
}
