import Dexie, { type EntityTable, type Table } from 'dexie';
import type { BookType } from './bookTypes';

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

type CachedFileRecord = {
  sourceUrl: string;
  relativePath: string;
  blob: Blob;
};

const db = new Dexie('tdbook-cache') as Dexie & {
  meta: EntityTable<BookCacheMeta, 'sourceUrl'>;
  files: Table<CachedFileRecord, [string, string]>;
};

db.version(1).stores({
  meta: 'sourceUrl',
  files: '[sourceUrl+relativePath], sourceUrl',
});

const KEY_SEP = '\0';

const blobUrlCache = new Map<string, string>();
const pendingBlobUrls = new Map<string, Promise<string | null>>();

function blobUrlKey(sourceUrl: string, relativePath: string) {
  return `${sourceUrl}${KEY_SEP}${relativePath}`;
}

export async function getBookCacheMeta(sourceUrl: string): Promise<BookCacheMeta | null> {
  const meta = await db.meta.get(sourceUrl);
  return meta?.status === 'ready' ? meta : null;
}

export async function isBookCached(sourceUrl: string): Promise<boolean> {
  return Boolean(await getBookCacheMeta(sourceUrl));
}

export async function getCachedFile(sourceUrl: string, relativePath: string): Promise<Blob | null> {
  const record = await db.files.get([sourceUrl, relativePath]);
  return record?.blob ?? null;
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

  await db.transaction('rw', db.meta, db.files, async () => {
    await db.meta.delete(sourceUrl);
    await db.files.where('sourceUrl').equals(sourceUrl).delete();
  });
}

export async function clearAllCacheRecords(): Promise<void> {
  for (const [, url] of blobUrlCache) {
    URL.revokeObjectURL(url);
  }
  blobUrlCache.clear();

  await db.transaction('rw', db.meta, db.files, async () => {
    await Promise.all([db.meta.clear(), db.files.clear()]);
  });
}

export async function putFiles(
  sourceUrl: string,
  entries: Array<{ relativePath: string; blob: Blob }>,
): Promise<void> {
  await db.files.bulkPut(
    entries.map(({ relativePath, blob }) => ({ sourceUrl, relativePath, blob })),
  );
}

export async function putMeta(meta: BookCacheMeta): Promise<void> {
  await db.meta.put(meta);
}

export async function readCachedText(
  sourceUrl: string,
  relativePath: string,
): Promise<string | null> {
  const blob = await getCachedFile(sourceUrl, relativePath);
  if (!blob) return null;
  return blob.text();
}

/** Test helper: drop in-memory blob URLs without touching IndexedDB. */
export function resetBlobUrlCacheForTests() {
  for (const [, url] of blobUrlCache) {
    URL.revokeObjectURL(url);
  }
  blobUrlCache.clear();
}
